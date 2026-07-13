import hashlib
import sys
import hmac

salt = 'salt'
secret = 'secret'

job_id = sys.argv[1]
exp = sys.argv[2]
token_type = sys.argv[3]

if token_type == 'legacy':
    print(hashlib.sha256((job_id + salt).encode('utf-8')).hexdigest())
elif token_type == 'new':
    message = f"pdf-job:v1:{job_id}:{exp}"
    print(hmac.new(secret.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).hexdigest())

