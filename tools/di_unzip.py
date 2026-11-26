"""Extract a Disney Infinity 3.0 bundle (_root_.zip). Port of disney_infinity.bms.
Usage: di_unzip.py BUNDLE OUTDIR [--list]"""
import sys, os, struct, subprocess, zlib
KEY = "681BBEEA63160188F9B7945104A51499"
def ctr(data):  # AES-128-CTR, counter starts at zero for every call
    return subprocess.run(["openssl", "enc", "-d", "-aes-128-ctr", "-K", KEY, "-iv", "0" * 32],
                          input=data, capture_output=True, check=True).stdout
def main():
    src, out = sys.argv[1], sys.argv[2]; listing = "--list" in sys.argv
    raw = open(src, "rb").read()
    head = ctr(raw[:8]); assert head[:4] == b"PK\xff\xff", head[:4]
    n = struct.unpack("<I", head[4:8])[0]
    tab = ctr(raw[:8 + n * 8])[8:]
    for k in range(n):
        crc, off = struct.unpack_from("<II", tab, k * 8)
        h = ctr(raw[off:off + 0x1e]); assert h[:4] == b"PK\x03\x04", (k, h[:4])
        method, = struct.unpack_from("<H", h, 8)
        csize, usize, nlen, elen = struct.unpack_from("<IIHH", h, 18)
        enc = csize if False else min(0x200, csize)
        # one CTR stream covers header + name + extra + first 0x200 data bytes
        pre = 0x1e + nlen + elen
        name = ctr(raw[off:off + pre])[0x1e:0x1e + nlen].decode("latin1")
        if name.endswith(".dct"): enc = csize
        if listing: print(f"{usize:>10} {name}"); continue
        dec = ctr(raw[off:off + pre + enc])[pre:]
        p = off + pre
        body = dec + raw[p + enc:p + csize]
        data = body if method == 0 else zlib.decompress(body, -15) if method == 8 else None
        if data is None: print("skip method", method, name); continue
        dst = os.path.join(out, name.replace("\\", "/").lstrip("/"))
        os.makedirs(os.path.dirname(dst), exist_ok=True); open(dst, "wb").write(data)
main()
