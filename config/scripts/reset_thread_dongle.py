"""Software reset of the Thread radio (Sonoff ZBDongle-E V2, an OpenThread RCP) without unplugging it.

Run by shell_command.reset_thread_dongle (see config/automations/thread_recover.yaml), with the OpenThread Border Router
add-on STOPPED so the port is free. The dongle's USB-serial chip (CP2102N) drives the radio's reset pin from RTS: with
DTR low, RTS asserted for 0.3 s and released again resets the radio. Found working on 2026-11-14, when the radio hung
("RCP failure ... Too many rcp failures, exiting") and only a physical replug helped before. Python standard library only.
"""
import fcntl, glob, os, struct, sys, termios, time

port = (glob.glob('/dev/serial/by-id/*Sonoff*') or ['/dev/ttyUSB0'])[0]
fd = os.open(port, os.O_RDWR | os.O_NOCTTY)


def lines(rts, dtr):
    for bit, on in ((termios.TIOCM_RTS, rts), (termios.TIOCM_DTR, dtr)):
        fcntl.ioctl(fd, termios.TIOCMBIS if on else termios.TIOCMBIC, struct.pack('I', bit))


lines(0, 0)
time.sleep(0.1)
lines(1, 0)      # RTS asserted: reset held
time.sleep(0.3)
lines(0, 0)      # released: the radio boots
time.sleep(0.5)
os.close(fd)
print('reset pulse sent on', port)
sys.exit(0)
