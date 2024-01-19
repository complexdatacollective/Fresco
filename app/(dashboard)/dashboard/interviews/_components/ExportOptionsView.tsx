import { type Dispatch, type SetStateAction } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Switch } from '~/components/ui/switch';
import { type ExportOptions } from './ExportInterviewsDialog';

type ExportOptionsViewProps = {
  exportOptions: ExportOptions;
  setExportOptions: Dispatch<SetStateAction<ExportOptions>>;
};

const ExportOptionsView = ({
  exportOptions,
  setExportOptions,
}: ExportOptionsViewProps) => {
  return (
    <div className="max-h-[600px] space-y-2.5 overflow-y-auto pl-1 pr-3 lg:space-y-4">
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold lg:text-lg">
            Export GraphML Files
          </h2>
          <p className="w-[90%] text-sm  text-muted-foreground">
            GraphML is the main file format used by the Network Canvas software.
            GraphML files can be used to manually import your data into Server,
            and can be opened by many other pieces of network analysis software.
          </p>
        </div>
        <div>
          <Switch
            checked={exportOptions.exportGraphML}
            onCheckedChange={(value) => {
              // When turning off, if the other format is off, enable it
              if (exportOptions.exportGraphML && !exportOptions.exportCSV) {
                setExportOptions((prevState) => ({
                  ...prevState,
                  exportCSV: !exportOptions.exportCSV,
                }));
              }
              setExportOptions((prevState) => ({
                ...prevState,
                exportGraphML: value,
              }));
            }}
          />
        </div>
      </div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold lg:text-lg">
            Export CSV Files
          </h2>
          <p className="w-[90%] text-sm  text-muted-foreground">
            CSV is a widely used format for storing network data, but this wider
            compatibility comes at the expense of robustness. If you enable this
            format, your networks will be exported as an{' '}
            <strong>attribute list file</strong> for each node type, an{' '}
            <strong>edge list file</strong> for each edge type, and an{' '}
            <strong>ego attribute file</strong> that also contains session data.
          </p>
        </div>
        <div>
          <Switch
            checked={exportOptions.exportCSV}
            onCheckedChange={(value) => {
              // When turning off, if the other format is off, enable it
              if (exportOptions.exportCSV && !exportOptions.exportGraphML) {
                setExportOptions((prevState) => ({
                  ...prevState,
                  exportGraphML: !exportOptions.exportGraphML,
                }));
              }
              setExportOptions((prevState) => ({
                ...prevState,
                exportCSV: value,
              }));
            }}
          />
        </div>
      </div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold lg:text-lg">Merge Sessions</h2>
          <p className="w-[90%] text-sm  text-muted-foreground">
            If you enable this option, exporting multiple sessions at the same
            time will cause them to be merged into a single file, on a
            per-protocol basis. In the case of CSV export, you will receive one
            of each type of file for each protocol. In the case of GraphML you
            will receive a single GraphML file with multiple{' '}
            <code>&lt;graph&gt;</code> elements. Please note that with the
            exception of Network Canvas Server, most software does not yet
            support multiple graphs in a single GraphML file.
          </p>
        </div>
        <div>
          <Switch
            checked={exportOptions.globalOptions.unifyNetworks}
            onCheckedChange={(value) =>
              setExportOptions((prevState) => ({
                ...prevState,
                globalOptions: {
                  ...prevState.globalOptions,
                  unifyNetworks: value,
                },
              }))
            }
          />
        </div>
      </div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold lg:text-lg">
            Use Screen Layout Coordinates
          </h2>
          <p className="w-[90%] text-sm  text-muted-foreground">
            By default Interviewer exports sociogram node coordinates as
            normalized X/Y values (a number between 0 and 1 for each axis, with
            the origin in the top left). Enabling this option will store
            coordinates as screen space pixel values, with the same origin.
          </p>
        </div>
        <div>
          <Switch
            checked={exportOptions.globalOptions.useScreenLayoutCoordinates}
            onCheckedChange={(value) => {
              // if useScreenLayoutCoordinates disabled set screenLayoutHeight
              // and screenLayoutWidth to window height and width
              if (!value) {
                setExportOptions((prevState) => ({
                  ...prevState,
                  globalOptions: {
                    ...prevState.globalOptions,
                    useScreenLayoutCoordinates: value,
                    screenLayoutHeight: window.screen.height,
                    screenLayoutWidth: window.screen.width,
                  },
                }));
                return;
              }
              setExportOptions((prevState) => ({
                ...prevState,
                globalOptions: {
                  ...prevState.globalOptions,
                  useScreenLayoutCoordinates: value,
                },
              }));
            }}
          />
        </div>
      </div>

      {/* Show additional screen settings if useScreenLayoutCoordinates enabled  */}
      {exportOptions.globalOptions.useScreenLayoutCoordinates && (
        <div className="space-y-3 py-3">
          <div>
            <h3 className="font-semibold">Screen Size</h3>
            <p className="text-sm text-muted-foreground">
              When computing screen layout coordinates, the following screen
              size (in pixels) will be used.
            </p>
          </div>
          <div className="my-1 space-y-1">
            <Label>Width (pixels, 1 pixel minimum)</Label>
            <Input
              type="number"
              min={1}
              value={exportOptions.globalOptions.screenLayoutWidth + ''}
              onChange={(e) =>
                setExportOptions((prevState) => ({
                  ...prevState,
                  globalOptions: {
                    ...prevState.globalOptions,
                    screenLayoutWidth: +e.target.value,
                  },
                }))
              }
            />
            {exportOptions.globalOptions.screenLayoutWidth < 1 && (
              <span className="text-xs font-semibold text-red-500">
                Minium with must be 1!
              </span>
            )}
          </div>
          <div className="my-1 space-y-1">
            <Label>Height (pixels, 1 pixel minimum)</Label>
            <Input
              type="number"
              min={1}
              value={exportOptions.globalOptions.screenLayoutHeight + ''}
              onChange={(e) =>
                setExportOptions((prevState) => ({
                  ...prevState,
                  globalOptions: {
                    ...prevState.globalOptions,
                    screenLayoutHeight: +e.target.value,
                  },
                }))
              }
            />
            {exportOptions.globalOptions.screenLayoutHeight < 1 && (
              <span className="text-xs font-semibold text-red-500">
                Minium height must be 1!
              </span>
            )}
          </div>

          <Button
            size={'sm'}
            className="text-xs font-semibold"
            disabled={
              exportOptions.globalOptions.screenLayoutHeight ===
                window.screen.height &&
              exportOptions.globalOptions.screenLayoutWidth ===
                window.screen.width
            }
            onClick={() => {
              setExportOptions((prevState) => ({
                ...prevState,
                globalOptions: {
                  ...prevState.globalOptions,
                  screenLayoutHeight: window.screen.height,
                  screenLayoutWidth: window.screen.width,
                },
              }));
            }}
          >
            Reset to device fullscreen resolution
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExportOptionsView;
