import { useRef } from 'react'

const styles = {
  area: {
    border: '2px dashed #1a3a5c', borderRadius: '8px', padding: '2rem',
    textAlign: 'center', cursor: 'pointer', color: '#1a3a5c',
  },
  input: { display: 'none' },
}

export default function FileUpload({ onFileSelect, accept = '*', label = 'Glissez un fichier ou cliquez' }) {
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }

  return (
    <div
      style={styles.area}
      onClick={() => inputRef.current.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={styles.input}
        onChange={(e) => onFileSelect(e.target.files[0])}
      />
      📁 {label}
    </div>
  )
}

