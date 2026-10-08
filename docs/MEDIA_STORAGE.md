# Media storage

Store logos, covers and product images uploaded by merchants are kept as files on the API host. PostgreSQL holds only their metadata (`media_assets`: owner store, uploader, content type, size, SHA-256). Customers and merchants load them from `GET /media/:id`.

This is approved for local development and for an initial **single-instance** MVP deployment with a persistent, backed-up volume. It is not safe on ephemeral or serverless disks, where files disappear on restart or redeploy.

## Configuration

| Setting             | Development                                    | Production                                                                      |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `MEDIA_STORAGE_DIR` | Optional; defaults to `apps/api/storage/media` | **Required**, absolute path on a persistent volume, e.g. `/var/lib/thigo/media` |

At every start the API creates the directory if needed and writes and deletes a probe file. It refuses to start when:

- `NODE_ENV=production` and `MEDIA_STORAGE_DIR` is missing;
- the path is relative;
- the directory cannot be created or written.

## Before the first production deployment

1. Mount a persistent volume (for example a Docker named volume or a cloud block disk) and set `MEDIA_STORAGE_DIR` to a folder on it.
2. Run one API instance only. Two instances would each see only their own files.
3. Include the folder in backups, together with the database. A restore needs both: a `media_assets` row without its file returns 404, and a file without its row is never served.
4. Verify the path after deploying: upload an image as a merchant, restart or redeploy the API, then confirm `GET /media/<id>` still returns 200.

## Upload rules

- JPEG, PNG or WebP, detected from the file's bytes; at most 5 MB.
- A merchant may upload 20 images a minute (429 beyond that). The counter is in memory, which matches the single-instance limit above.
- A store may keep at most 300 uploads.
- A store can attach only images it uploaded.
- Responses carry `Cache-Control: public, max-age=31536000, immutable`, `nosniff` and a sandbox CSP. Ids are random UUIDs; images are public catalog content.

## Clean-up

Replacing or removing a logo, cover or product image, or deleting a product, deletes the old image unless another store image, product or past order line still uses it. Archived products keep their images because order history shows them.

Known gap: an image that is uploaded but never attached (for example, a form abandoned before saving) is not removed yet. The 300-per-store cap bounds it. The follow-up is a periodic job that removes `media_assets` rows older than a day that nothing references, using the same check as above.

## Moving to S3-compatible storage later

Needed before running more than one API instance.

1. Add an object-store implementation of `MediaFileStore` (`write`, `open`, `remove`), keyed by the media id. Nothing else reads or writes the files.
2. Copy the existing files into the bucket under the same ids.
3. Keep `GET /media/:id` as the public URL (stream or redirect to a signed URL), so stored `/media/<id>` URLs in stores, products and order lines keep working with no data migration.
4. Move the upload rate limit to shared storage, or to the gateway, at the same time.
