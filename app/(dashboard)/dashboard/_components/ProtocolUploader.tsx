'use client';
import { useDropzone } from 'react-dropzone';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FileWithPath } from 'react-dropzone';
import { generateReactHelpers } from '@uploadthing/react/hooks';
import { useState, useCallback } from 'react';
import { importProtocol } from '../_actions/importProtocol';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import type { UploadFileResponse } from 'uploadthing/client';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import ActiveProtocolSwitch from '~/app/(dashboard)/dashboard/_components/ActiveProtocolSwitch';
import { getProtocolJson } from '~/utils/protocolImport';
import type { Protocol } from '@codaco/shared-consts';

const { useUploadThing } = generateReactHelpers();

type ReadAs = 'arrayBuffer' | 'binaryString' | 'dataURL' | 'text';

function readFileHelper(
  file: Blob | File,
  readAs: ReadAs = 'arrayBuffer',
): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', (err) => {
      reader.abort();
      reject(err);
    });

    reader.addEventListener('load', () => {
      resolve(reader.result);
    });

    if (readAs === 'arrayBuffer') {
      reader.readAsArrayBuffer(file);
    } else if (readAs === 'binaryString') {
      reader.readAsBinaryString(file);
    } else if (readAs === 'dataURL') {
      reader.readAsDataURL(file);
    } else if (readAs === 'text') {
      reader.readAsText(file, 'utf-8');
    }
  });
}

export default function ProtocolUploader({
  onUploaded,
}: {
  onUploaded?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleUploadComplete = async (
    res: UploadFileResponse[] | undefined,
  ) => {
    if (!res) return;

    setOpen(true);
    const firstFile = res[0];
    if (!firstFile) return;

    const { error, success } = await importProtocol(firstFile);

    if (error || !success) {
      return;
    }
  };

  const { startUpload } = useUploadThing('protocolUploader', {
    onClientUploadComplete: (res) => void handleUploadComplete(res),
    onUploadError: (error) => {
      setOpen(true);
    },
    onUploadBegin: () => {
      setOpen(true);
    },
  });

  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    onDropAccepted: async (acceptedFiles) => {
      try {
        setProcessing(true);
        setStatusText('Processing...');
        console.log({ acceptedFiles });

        const acceptedFile = acceptedFiles[0] as File;

        setStatusText('Reading file...');
        const content = await readFileHelper(acceptedFile);

        if (!content) {
          setStatusText('Error reading file');
          setProcessing(false);
          return;
        }

        console.log('content', content);

        const JSZip = (await import('jszip')).default;

        console.log(JSZip);
        const zip = await JSZip.loadAsync(content);

        console.log({ zip });

        const protocolJson = (await getProtocolJson(zip)) as Protocol;

        // Validating protocol...

        const { validateProtocol, ValidationError } = await import(
          '@codaco/protocol-validation'
        );

        try {
          await validateProtocol(protocolJson);
        } catch (error) {
          if (error instanceof ValidationError) {
            return {
              error: error.message,
              errorDetails: [...error.logicErrors, ...error.schemaErrors],
              success: false,
            };
          }

          throw error;
        }

        console.log('protocol is valid!');

        setProcessing(false);
        setStatusText(null);
      } catch (e) {
        console.log(e);
        setProcessing(false);
        setStatusText('Error with process');
      }

      // if (files && files[0]) {
      //   startUpload([file]).catch((e: Error) => {
      //     // eslint-disable-next-line no-console
      //     console.log(e);
      //     setOpen(true);
      //     setDialogContent({
      //       title: 'Protocol import',
      //       description: 'Error uploading protocol',
      //       progress: false,
      //       error: e.message,
      //     });
      //   });
      // }
    },
    accept: {
      'application/octect-stream': ['.netcanvas'],
      'application/zip': ['.netcanvas'],
    },
  });

  return (
    <>
      {processing ? (
        <>
          <p>Processing...</p>
          <p>{statusText}</p>
          <button>Cancel</button>
        </>
      ) : (
        <div
          {...getRootProps()}
          className="mt-2 rounded-xl border-2 border-dashed border-gray-500 bg-gray-200 p-12 text-center"
        >
          {statusText && <p>{statusText}</p>}
          <Button variant="default" size="sm">
            <input {...getInputProps()} />
            Import protocol
          </Button>
          <div>Click to select .netcanvas file or drag and drop here</div>
        </div>
      )}
    </>
  );
}

const ProgressDialog = ({ content }: { content: string }) => {
  return (
    <Dialog open>
      <DialogContent title="Protocol import">
        <DialogDescription>{content}</DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

// const ProgressDialog = () => {
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>{dialogContent.title}</DialogTitle>
//           <DialogDescription>{dialogContent.description}</DialogDescription>
//         </DialogHeader>
//         {dialogContent.progress && (
//           <div className="w-full">
//             <div className="h-1.5 w-full overflow-hidden bg-pink-100">
//               <div className="h-full w-full origin-left-right animate-indeterminate-progress-bar bg-violet-800"></div>
//             </div>
//           </div>
//         )}
//         {dialogContent.error && (
//           <Collapsible open={showErrorDetails}>
//             <Button
//               variant={'outline'}
//               onClick={() => setShowErrorDetails(!showErrorDetails)}
//             >
//               {showErrorDetails ? (
//                 <>
//                   Hide details <ChevronUp />
//                 </>
//               ) : (
//                 <>
//                   Show details <ChevronDown />
//                 </>
//               )}
//             </Button>
//             <CollapsibleContent className="flex flex-grow">
//               <code className="mt-4 flex-grow rounded-md bg-black p-4 text-white">
//                 {dialogContent.error}
//               </code>
//             </CollapsibleContent>
//           </Collapsible>
//         )}
//         {!dialogContent.progress &&
//           !dialogContent.error &&
//           lastUploadedProtocol && (
//             <div className="w-full space-y-6">
//               <div>
//                 <div className="space-y-4">
//                   <div className="flex flex-row items-center rounded-lg border p-4">
//                     <div className="space-y-0.5">
//                       <label>Mark protocol as active?</label>
//                       <p className="text-xs">
//                         Only one protocol may be active at a time. If you
//                         already have an active protocol, activating this one
//                         will make it inactive.
//                       </p>
//                     </div>
//                     <div>
//                       <ActiveProtocolSwitch
//                         initialData={lastUploadedProtocol.active}
//                         hash={lastUploadedProtocol.hash}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <Button type="submit" onClick={handleFinishImport}>
//                 Finish Import
//               </Button>
//             </div>
//           )}
//       </DialogContent>
//     </Dialog>
//   );
// }
