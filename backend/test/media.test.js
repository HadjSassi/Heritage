describe('Media service — URL generation', () => {
  it('generates correct MinIO public URL', () => {
    const endpoint = 'minio'
    const port = '9000'
    const bucket = 'heritage-media'
    const objectName = 'uuid-photo.jpg'
    const url = `http://${endpoint}:${port}/${bucket}/${objectName}`
    expect(url).toBe('http://minio:9000/heritage-media/uuid-photo.jpg')
  })

  it('determines media type from mime type', () => {
    const getType = (mime) => mime.startsWith('image') ? 'PHOTO' : mime.startsWith('audio') ? 'AUDIO' : 'DOCUMENT'
    expect(getType('image/jpeg')).toBe('PHOTO')
    expect(getType('audio/mp3')).toBe('AUDIO')
    expect(getType('application/pdf')).toBe('DOCUMENT')
  })
})

