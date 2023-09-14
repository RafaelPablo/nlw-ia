import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react"
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export function VideoInputForm() {
  const [videoFile, setVideoFile] = useState< File | null >(null)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  async function convertVideoToAudio(video: File) {
    console.log('convertion started.')

    const ffmpeg = await getFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    // ffmpeg.on('log', log => {
    //   console.log(log)
    // })

    ffmpeg.on('progress', progress => {
      console.log('Convert progress: ' + Math.round( progress.progress * 100))
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')
    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg',
    })

    console.log('Convertion finished.')

    return audioFile
  }

  function handleSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if (!files) {
      return
    }

    const selectedFile = files[0]

    setVideoFile(selectedFile)
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value

    if (!videoFile){
      return
    }


    const audioFile = await convertVideoToAudio(videoFile)

    console.log(audioFile)

  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    }

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <>
      <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
      >
        {previewURL ? (
          <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0"/>
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Upload video
          </>
        )}
      </label>

      <br/>

      <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleSelectedFile}/>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription-prompt"> Transcription prompt </Label>
        <Textarea
          ref={promptInputRef}
          id="transcription-prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Include key words mentioned on the video separated by comma (,)" />
      </div>

      <Button type="submit" className="w-full">
        Load video
        <Upload className="w-4 h-4 ml-2" />
      </Button>
      </form>
    </>
  )
}