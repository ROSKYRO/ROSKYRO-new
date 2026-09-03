"""
Shared rate limiter (per client IP) used on login endpoints to slow down
brute-force / credential-stuffing attempts. Backed by slowapi (in-memory by
default). If you run more than one backend instance behind a load balancer,
point this at Redis instead (storage_uri="redis://...") so limits are shared
across instances — with the in-memory default, each instance tracks its own
counts, which effectively multiplies the limit by the number of instances.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
