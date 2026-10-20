import json
import os
from urllib.parse import unquote_plus


def handler(event, context):
    records = event.get("Records", [])
    uploads = []

    for record in records:
        bucket = record.get("s3", {}).get("bucket", {}).get("name")
        key = unquote_plus(record.get("s3", {}).get("object", {}).get("key", ""))
        size = record.get("s3", {}).get("object", {}).get("size")
        uploads.append({"bucket": bucket, "key": key, "size": size})

    print(json.dumps({
        "message": "ShopSphere product image uploaded",
        "project": os.environ.get("PROJECT", "ShopSphere"),
        "uploads": uploads
    }))

    return {"processed": len(uploads)}
