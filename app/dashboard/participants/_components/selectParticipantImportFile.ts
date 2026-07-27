export default function selectParticipantImportFile(
  acceptedFiles: readonly File[],
  rejectedFiles: readonly { file: File }[],
) {
  if (acceptedFiles.length !== 1 || rejectedFiles.length > 0) {
    return null;
  }

  return acceptedFiles[0] ?? null;
}
