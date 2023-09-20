import { ImagePlus } from 'lucide-react';
import Papa from 'papaparse';
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

interface DropZoneProps {
  className: string;
  files: Array<File>;
  setFiles: Dispatch<SetStateAction<File[]>>;
  setCsvColumns: Dispatch<SetStateAction<string[]>>;
  setCsvParticipants: Dispatch<SetStateAction<Record<string, string>[]>>;
  setErrMsg: Dispatch<SetStateAction<string>>;
  errMsg: string;
}

const Dropzone = ({
  className,
  files,
  errMsg,
  setFiles,
  setCsvColumns,
  setCsvParticipants,
  setErrMsg,
}: DropZoneProps) => {
  const [rejected, setRejected] = useState<FileRejection[]>([]);

  useEffect(() => {
    if (files.length) {
      setErrMsg('');
      parseCSV(files[0] as File);
    } else {
      setCsvColumns([]);
    }
  }, [files]);

  function parseCSV(csvFile: File) {
    // Parse local CSV file
    Papa.parse(csvFile, {
      skipEmptyLines: true,
      header: true,
      complete: function (results: Papa.ParseResult<Record<string, string>>) {
        setCsvParticipants([...results.data]);
        const ObjKeys = Object.keys(results.data[0] || {});

        // check if the file contains 'identifier' column or has at least one column to use as an identifier
        if (!(ObjKeys.includes('identifier') || ObjKeys.length === 1)) {
          setCsvColumns(ObjKeys);
        }
      },
    });
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (acceptedFiles?.length) {
        setFiles([...acceptedFiles]);
      }

      if (fileRejections?.length) {
        setRejected((previousFiles) => [...previousFiles, ...fileRejections]);
      }
    },
    [setFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/vnd.ms-excel': [],
    },
    maxFiles: 1,
    maxSize: 1024 * 5000,
    onDrop,
  });

  const removeFile = (name: string) => {
    setFiles((files) => files.filter((file) => file.name !== name));
  };

  const removeRejected = (i: number) => {
    rejected.splice(i, 1);
    setRejected([...rejected]);
  };

  return (
    <>
      <div
        {...getRootProps({
          className: className,
        })}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <ImagePlus className="text-red-400" size={28} />
          {isDragActive ? (
            <p className="text-sm">drop file here...</p>
          ) : (
            <p className="text-sm">
              Drag & drop file here, or click to select file
            </p>
          )}
        </div>
      </div>

      {errMsg && <p className="text-red-500">{errMsg}</p>}

      {/* Preview */}
      <section className="mt-1">
        {files?.length > 0 && (
          <div className="w-full px-4">
            {/* Accepted files */}
            <h3 className="mt-3 border-b pb-2 text-sm font-semibold text-neutral-600">
              Accepted file
            </h3>
            <ul className="mt-3 gap-4">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="relative w-full rounded-md p-2 shadow-lg"
                >
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full border border-red-400 bg-red-400 transition-colors hover:bg-white"
                    onClick={() => removeFile(file.name)}
                  >
                    x
                  </button>
                </li>
              ))}
            </ul>
            {/* Rejected Files */}
            {rejected?.length > 0 && (
              <h3 className="mt-3 border-b pb-2 text-sm font-semibold text-neutral-600">
                Rejected files
              </h3>
            )}
            <ul className="mt-3 flex flex-col">
              {rejected.map(({ file, errors }, index) => (
                <li key={index} className="flex items-start justify-between">
                  <div>
                    <p className="mt-2 text-sm font-medium text-neutral-500">
                      {file.name}
                    </p>
                    <ul className="text-[12px] text-red-400">
                      {errors.map((error) => (
                        <li key={error.code}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    className="border-secondary-400 mt-1 rounded-md border px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:bg-red-400 hover:text-white"
                    onClick={() => removeRejected(index)}
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
};

export default Dropzone;
