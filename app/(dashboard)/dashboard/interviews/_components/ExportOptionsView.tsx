import { type Dispatch, type SetStateAction } from 'react';
import { Switch } from '~/components/ui/switch';
import { type ExportOptions } from '~/utils/validateExportOptions';

type ExportOptionsViewProps = {
  exportOptions: ExportOptions;
  setExportOptions: Dispatch<SetStateAction<ExportOptions>>;
  setOptionsToLocalStorage: (options: ExportOptions) => void;
};

const ExportOptionsView = ({
  exportOptions,
  setExportOptions,
  setOptionsToLocalStorage,
}: ExportOptionsViewProps) => {
  const handleGraphMLSwitch = (value: boolean) => {
    // When turning off, if the other format is off, enable it
    if (exportOptions.exportGraphML && !exportOptions.exportCSV) {
      setExportOptions((prevState) => {
        const updatedOptions = {
          ...prevState,
          exportCSV: !exportOptions.exportCSV,
        };
        setOptionsToLocalStorage(updatedOptions);
        return updatedOptions;
      });
    }
    setExportOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        exportGraphML: value,
      };
      setOptionsToLocalStorage(updatedOptions);
      return updatedOptions;
    });
  };

  const handleCSVSwitch = (value: boolean) => {
    // When turning off, if the other format is off, enable it
    if (exportOptions.exportCSV && !exportOptions.exportGraphML) {
      setExportOptions((prevState) => {
        const updatedOptions = {
          ...prevState,
          exportGraphML: !exportOptions.exportGraphML,
        };
        setOptionsToLocalStorage(updatedOptions);
        return updatedOptions;
      });
    }
    setExportOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        exportCSV: value,
      };
      setOptionsToLocalStorage(updatedOptions);
      return updatedOptions;
    });
  };

  const handleUnifyNetworksSwitch = (value: boolean) =>
    setExportOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        globalOptions: {
          ...prevState.globalOptions,
          unifyNetworks: value,
        },
      };
      setOptionsToLocalStorage(updatedOptions);
      return updatedOptions;
    });

  const handleScreenLayoutCoordinatesSwitch = (value: boolean) =>
    setExportOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        globalOptions: {
          ...prevState.globalOptions,
          useScreenLayoutCoordinates: value,
        },
      };
      setOptionsToLocalStorage(updatedOptions);
      return updatedOptions;
    });

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
            onCheckedChange={handleGraphMLSwitch}
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
            onCheckedChange={handleCSVSwitch}
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
            onCheckedChange={handleUnifyNetworksSwitch}
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
            onCheckedChange={handleScreenLayoutCoordinatesSwitch}
          />
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsView;
