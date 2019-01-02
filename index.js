const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const { Storage } = require('@google-cloud/storage')
const sharp = require('sharp')

exports.image_optimizer = async (req, res) => {
  const projectId = process.env.GCP_PROJECT
  const bucket = process.env.BUCKET_NAME

  const storage = new Storage({ projectId: projectId })

  const quality = parseInt(req.query.q)
  const width = parseInt(req.query.w)
  const height = parseInt(req.query.h)
  const accept = req.get('accept')

  if (!accept.includes('image')) {
    res.status(400).send({ message: 'accept header do not include image' })
    return
  }

  const dir = path.join(os.tmpdir(), 'workspace')
  await fs.ensureDir(dir)

  const name = req.path.split('/').pop()
  const tempFile = path.join(dir, name)

  const file = storage.bucket(bucket).file(req.path.substring(1))

  const metadata = await file.getMetadata()
  const contentType = metadata[0].contentType

  await file.download({ destination: tempFile })

  let s = await sharp(tempFile)
  if (width && height) {
    s = s
      .resize(width, height)
      .max()
      .withoutEnlargement()
  }
  let buffer = null
  if (accept.includes('image/webp')) {
    if (quality) {
      s = s.webp({ quality: quality })
    } else {
      s = s.webp()
    }
    buffer = await s.toBuffer()
    res.set('Content-Type', 'image/webp')
  } else {
    buffer = await s.toBuffer()
    if (quality) {
      buffer = await imagemin.buffer(buffer, {
        plugins: [
          imageminMozjpeg({ quality: quality }),
          imageminPngquant({ quality: quality })
        ]
      })
    }
    res.set('Content-Type', contentType)
  }

  res.set('Vary', 'Accept')
  res.set('Cache-Control', 'public, max-age=86400')
  res.send(buffer)
}
