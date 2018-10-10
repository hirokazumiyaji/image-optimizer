const { Storage } = require('@google-cloud/storage')
const gm = require('gm').subClass({ imageMagick: true })

const options = '!'

exports.image_optimizer = (req, res) => {
  const projectId = process.env.GCP_PROJECT
  const bucket = process.env.BUCKET_NAME

  const storage = new Storage({ projectId: projectId })

  const quality = req.query.q
  const width = req.query.w
  const height = req.query.h
  const accept = req.get('accept')

  if (!accept.includes('image')) {
    res.status(400).send({ message: 'accept header do not include image' })
    return
  }

  const file = storage.bucket(bucket).file(req.path.substring(1))

  let stream = file.createReadStream()

  stream.on('error', err => {
    console.error(err)
    res.status(err.code).send({ message: err })
  })

  let resStream = gm(stream)
  if (width && height) {
    resStream = resStream.resize(width, height, options)
  }
  if (quality) {
    resStream = resStream.quality(quality)
  }
  if (accept.includes('image/webp')) {
    resStream = resStream.stream('webp')
  } else {
    resStream = resStream.stream()
  }
  resStream.pipe(res)
}
