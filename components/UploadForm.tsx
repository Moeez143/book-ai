"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon, LoaderCircle, Upload, X } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  DEFAULT_VOICE,
  MAX_FILE_SIZE,
  voiceCategories,
  voiceOptions,
} from "@/lib/contants"
import { cn } from "@/lib/utils"

const fileSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Please upload a PDF file"
  )
  .refine((file) => file.size <= MAX_FILE_SIZE, "PDF file must be 50MB or less")
  .refine(
    (file) => ACCEPTED_PDF_TYPES.includes(file.type),
    "Please upload a valid PDF file"
  )

const coverSchema = z
  .custom<File | undefined>(
    (value) =>
      value === undefined ||
      (typeof File !== "undefined" && value instanceof File),
    "Please upload a valid image"
  )
  .refine(
    (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Cover image must be JPG, PNG, or WebP"
  )

const uploadFormSchema = z.object({
  pdfFile: fileSchema,
  coverImage: coverSchema.optional(),
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author name is required"),
  voice: z.enum(["dave", "daniel", "chris", "rachel", "sarah"]),
})

type UploadFormValues = z.infer<typeof uploadFormSchema>
type VoiceKey = UploadFormValues["voice"]

const voiceGroups: Array<{
  title: string
  keys: VoiceKey[]
}> = [
  { title: "Male Voices", keys: voiceCategories.male as VoiceKey[] },
  { title: "Female Voices", keys: voiceCategories.female as VoiceKey[] },
]

function LoadingOverlay() {
  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper bg-white shadow-soft-lg">
        <div className="loading-shadow">
          <LoaderCircle className="loading-animation h-12 w-12 text-[#663820]" />
          <p className="loading-title">Preparing your book</p>
          <div className="loading-progress">
            <div className="loading-progress-item">
              <span className="loading-progress-status" />
              <span>Synthesizing assistant experience</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FileName({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 text-center">
      <span className="max-w-65 truncate text-base font-semibold text-[#663820] sm:max-w-md">
        {file.name}
      </span>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        className="upload-dropzone-remove"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onRemove()
        }}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function UploadForm() {
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      coverImage: undefined,
      title: "",
      author: "",
      voice: DEFAULT_VOICE,
    },
  })

  const pdfFile = useWatch({ control: form.control, name: "pdfFile" })
  const coverImage = useWatch({ control: form.control, name: "coverImage" })
  const selectedVoice = useWatch({ control: form.control, name: "voice" })
  const isSubmitting = form.formState.isSubmitting

  const selectedVoiceName = voiceOptions[selectedVoice].name

  async function onSubmit(values: UploadFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    console.info("Book upload form submitted", {
      ...values,
      pdfFile: values.pdfFile.name,
      coverImage: values.coverImage?.name,
    })
  }

  return (
    <div className="new-book-wrapper">
      {isSubmitting && <LoadingOverlay />}

      {/* <p className="text-sm font-medium text-[#3d485e]">
        5 of 10 books used (Upgrade)
      </p> */}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="pdfFile"
            render={({ field: { onChange, name, ref } }) => (
              <FormItem>
                <FormLabel className="form-label">Book PDF File</FormLabel>
                <FormControl>
                  <label
                    className={cn(
                      "upload-dropzone border-2 border-dashed border-(--border-subtle)",
                      pdfFile && "upload-dropzone-uploaded"
                    )}
                  >
                    <input
                      ref={ref}
                      name={name}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="sr-only"
                      disabled={isSubmitting}
                      onChange={(event) =>
                        onChange(event.target.files?.[0] ?? undefined)
                      }
                    />
                    {pdfFile ? (
                      <FileName
                        file={pdfFile}
                        onRemove={() => {
                          form.setValue("pdfFile", undefined as unknown as File, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                      />
                    ) : (
                      <>
                        <Upload className="upload-dropzone-icon" />
                        <span className="upload-dropzone-text">
                          Click to upload PDF
                        </span>
                        <span className="upload-dropzone-hint">
                          PDF file (max 50MB)
                        </span>
                      </>
                    )}
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field: { onChange, name, ref } }) => (
              <FormItem>
                <FormLabel className="form-label">
                  Cover Image (Optional)
                </FormLabel>
                <FormControl>
                  <label
                    className={cn(
                      "upload-dropzone border-2 border-dashed border-(--border-subtle)",
                      coverImage && "upload-dropzone-uploaded"
                    )}
                  >
                    <input
                      ref={ref}
                      name={name}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="sr-only"
                      disabled={isSubmitting}
                      onChange={(event) =>
                        onChange(event.target.files?.[0] ?? undefined)
                      }
                    />
                    {coverImage ? (
                      <FileName
                        file={coverImage}
                        onRemove={() => {
                          form.setValue("coverImage", undefined, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                      />
                    ) : (
                      <>
                        <ImageIcon className="upload-dropzone-icon" />
                        <span className="upload-dropzone-text">
                          Click to upload cover image
                        </span>
                        <span className="upload-dropzone-hint">
                          Leave empty to auto-generate from PDF
                        </span>
                      </>
                    )}
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <input
                    className="form-input"
                    placeholder="ex: Rich Dad Poor Dad"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <input
                    className="form-input"
                    placeholder="ex: Robert Kiyosaki"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">
                  Choose Assistant Voice
                </FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {voiceGroups.map((group) => (
                      <div key={group.title} className="space-y-2">
                        <p className="text-sm font-medium text-[#3d485e]">
                          {group.title}
                        </p>
                        <div
                          className={cn(
                            "voice-selector-options gap-4",
                            group.keys.length === 3
                              ? "sm:flex-row"
                              : "sm:grid sm:grid-cols-2"
                          )}
                        >
                          {group.keys.map((voiceKey) => {
                            const voice = voiceOptions[voiceKey]
                            const isSelected = field.value === voiceKey

                            return (
                              <label
                                key={voiceKey}
                                className={cn(
                                  "voice-selector-option items-start justify-start",
                                  isSelected
                                    ? "voice-selector-option-selected"
                                    : "voice-selector-option-default"
                                )}
                              >
                                <input
                                  type="radio"
                                  className="mt-1 h-4 w-4 accent-[#663820]"
                                  value={voiceKey}
                                  checked={isSelected}
                                  disabled={isSubmitting}
                                  onChange={() => field.onChange(voiceKey)}
                                />
                                <span className="min-w-0 space-y-1">
                                  <span className="block font-bold text-[#222c37]">
                                    {voice.name}
                                  </span>
                                  <span className="block text-sm leading-5 text-[#3d485e]">
                                    {voice.description}
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <p className="sr-only">Selected voice: {selectedVoiceName}</p>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="form-btn" disabled={isSubmitting}>
            Begin Synthesis
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default UploadForm
