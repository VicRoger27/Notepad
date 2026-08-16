#!/usr/bin/env python3
"""
Generates a valid Linux ELF 64-bit executable (cross-notepad.elf and CrossNotepad.elf)
in the bin/ directory that launches the Cross Notepad environment on any Linux x86_64 system.
"""

import struct
import os

def create_linux_elf(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    base_vaddr = 0x400000
    entry_offset = 0x1000  # Page aligned code entry

    shell_str = b"/bin/sh\x00"
    dash_c_str = b"-c\x00"
    cmd_str = b"DIR=\"$(cd \"$(dirname \"$0\")/..\" 2>/dev/null && pwd)\"; if [ -f \"$DIR/notepad.sh\" ]; then bash \"$DIR/notepad.sh\" \"$@\"; elif [ -f \"$DIR/notepad.py\" ]; then python3 \"$DIR/notepad.py\" \"$@\"; else echo 'Cross Notepad launcher'; fi\x00"

    off_code_end = 0x28
    
    off_shell = off_code_end
    off_dash_c = off_shell + len(shell_str)
    off_cmd = off_dash_c + len(dash_c_str)
    off_argv_unaligned = off_cmd + len(cmd_str)
    off_argv = (off_argv_unaligned + 7) & ~7

    rel_shell = off_shell - 0x0e
    rel_argv = off_argv - 0x15

    code = bytearray()
    code += bytes([0x48, 0xc7, 0xc0, 0x3b, 0x00, 0x00, 0x00]) # mov rax, 59
    code += bytes([0x48, 0x8d, 0x3d]) + struct.pack('<i', rel_shell) # lea rdi, [rip + rel_shell]
    code += bytes([0x48, 0x8d, 0x35]) + struct.pack('<i', rel_argv) # lea rsi, [rip + rel_argv]
    code += bytes([0x48, 0x31, 0xd2]) # xor rdx, rdx
    code += bytes([0x0f, 0x05]) # syscall
    code += bytes([0x48, 0xc7, 0xc0, 0x3c, 0x00, 0x00, 0x00]) # mov rax, 60
    code += bytes([0x48, 0x31, 0xff]) # xor rdi, rdi
    code += bytes([0x0f, 0x05]) # syscall
    
    while len(code) < off_code_end:
        code.append(0x90)

    code += shell_str
    code += dash_c_str
    code += cmd_str

    while len(code) < off_argv:
        code.append(0x00)

    addr_shell = base_vaddr + entry_offset + off_shell
    addr_dash_c = base_vaddr + entry_offset + off_dash_c
    addr_cmd = base_vaddr + entry_offset + off_cmd

    code += struct.pack('<QQQQ', addr_shell, addr_dash_c, addr_cmd, 0)

    e_ident = b"\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    e_type = 2  # ET_EXEC
    e_machine = 62  # EM_X86_64
    e_version = 1
    e_entry = base_vaddr + entry_offset
    e_phoff = 64
    e_shoff = 0
    e_flags = 0
    e_ehsize = 64
    e_phentsize = 56
    e_phnum = 1
    e_shentsize = 0
    e_shnum = 0
    e_shstrndx = 0

    elf_header = struct.pack(
        '<16sHHIQQQIHHHHHH',
        e_ident, e_type, e_machine, e_version,
        e_entry, e_phoff, e_shoff, e_flags,
        e_ehsize, e_phentsize, e_phnum,
        e_shentsize, e_shnum, e_shstrndx
    )

    total_filesz = entry_offset + len(code)

    prog_header = struct.pack(
        '<IIQQQQQQ',
        1, 7, 0,
        base_vaddr, base_vaddr, total_filesz, total_filesz, 0x1000
    )

    file_bytes = bytearray()
    file_bytes += elf_header
    file_bytes += prog_header

    file_bytes += bytes(entry_offset - len(file_bytes))
    file_bytes += code

    with open(output_path, 'wb') as f:
        f.write(file_bytes)

    print(f"Generated Linux ELF 64-bit executable: {output_path} ({len(file_bytes)} bytes)")

if __name__ == '__main__':
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    linux_dir = os.path.join(root_dir, 'Linux')
    create_linux_elf(os.path.join(linux_dir, 'CrossNotepad.elf'))
