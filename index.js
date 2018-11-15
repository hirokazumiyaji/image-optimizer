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

  const file = storage.bucket(bucket).file(req.path.substring(1))

  const metadata = await file.getMetadata()
  const contentType = metadata[0].contentType

  let inStream = file.createReadStream()

  inStream.on('error', err => {
    console.error(err)
    res.status(err.code).send({ message: err })
  })

  let outStream = await sharp(inStream)
  if (width && height) {
    outStream = outStream
      .resize(width, height)
      .max()
      .withoutEnlargement()
  }
  const buffer = await outStream.toBuffer()
  res.set('Content-Type', contentType)
  //let buffer = null
  //if (accept.includes('image/webp')) {
  //  if (quality) {
  //    outStream = outStream.webp({ quality: quality })
  //  } else {
  //    outStream = outStream.webp()
  //  }
  //  try {
  //    buffer = await outStream.toBuffer()
  //  } catch (e) {
  //    console.group('toBuffer webp')
  //    console.log(e)
  //    console.groupEnd()
  //    throw e
  //  }
  //  res.set('Content-Type', 'image/webp')
  //} else {
  //  try {
  //    buffer = await outStream.toBuffer()
  //  } catch (e) {
  //    console.group('toBuffer webp')
  //    console.log(e)
  //    console.groupEnd()
  //    throw e
  //  }
  //  if (quality) {
  //    buffer = await imagemin.buffer(buffer, {
  //      plugins: [
  //        imageminMozjpeg({ quality: quality }),
  //        imageminPngquant({ quality: quality })
  //      ]
  //    })
  //  }
  //  res.set('Content-Type', contentType)
  //}

  res.set('Vary', 'Accept')
  res.set('Cache-Control', 'public, max-age=86400')
  res.send(buffer)
}
