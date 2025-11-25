import { type Dispatch, type SetStateAction } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { ToggleField as Switch } from '~/lib/form/components/fields/Toggle';
import type { ExportOptions } from '~/lib/network-exporters/utils/types';
import { cx } from '~/utils/cva';

const sectionClasses = cx(
  'p-4 flex gap-4',
  '[&_div]:basis-[fit-content]',
  '[&_div:nth-child(2)]:flex [&_div:nth-child(2)]:items-center [&_div:nth-child(2)]:justify-center [&_div:nth-child(2)]:p-4',
);

const ExportOptionsView = ({
  exportOptions,
  setExportOptions,
}: {
  exportOptions: ExportOptions;
  setExportOptions: Dispatch<SetStateAction<ExportOptions>>;
}) => {
  const handleGraphMLSwitch = (value: boolean) => {
    // When turning off, if the other format is off, enable it
    if (exportOptions.exportGraphML && !exportOptions.exportCSV) {
      setExportOptions((prevState) => {
        const updatedOptions = {
          ...prevState,
          exportCSV: !exportOptions.exportCSV,
        };
        return updatedOptions;
      });
    }
    setExportOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        exportGraphML: value,
      };
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
        return updatedOptions;
      });
    }
    setExportOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        exportCSV: value,
      };
      return updatedOptions;
    });
  };

  const handleScreenLayoutCoordinatesSwitch = (value: boolean) =>
    setExportOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        globalOptions: {
          ...prevState.globalOptions,
          useScreenLayoutCoordinates: value,
        },
      };
      return updatedOptions;
    });

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      <div className={sectionClasses}>
        <div>
          <Heading level="h4" variant="all-caps">
            Export GraphML Files
          </Heading>
          <Paragraph intent="smallText">
            GraphML is the main file format used by the Network Canvas software.
            GraphML files can be used to manually import your data into Server,
            and can be opened by many other pieces of network analysis software.
          </Paragraph>
        </div>
        <div>
          <Switch
            value={exportOptions.exportGraphML}
            onChange={handleGraphMLSwitch}
          />
        </div>
      </div>
      <div className={sectionClasses}>
        <div>
          <Heading level="h4" variant="all-caps">
            Export CSV Files
          </Heading>
          <Paragraph intent="smallText">
            CSV is a widely used format for storing network data, but this wider
            compatibility comes at the expense of robustness. If you enable this
            format, your networks will be exported as an{' '}
            <strong>attribute list file</strong> for each node type, an{' '}
            <strong>edge list file</strong> for each edge type, and an{' '}
            <strong>ego attribute file</strong> that also contains session data.
          </Paragraph>
        </div>
        <div>
          <Switch value={exportOptions.exportCSV} onChange={handleCSVSwitch} />
        </div>
      </div>
      <div className={sectionClasses}>
        <div>
          <Heading level="h4" variant="all-caps">
            Use Screen Layout Coordinates
          </Heading>
          <Paragraph intent="smallText">
            By default Interviewer exports sociogram node coordinates as
            normalized X/Y values (a number between 0 and 1 for each axis, with
            the origin in the top left). Enabling this option will store
            coordinates as screen space pixel values, with the same origin.
          </Paragraph>
        </div>
        <div>
          <Switch
            value={exportOptions.globalOptions.useScreenLayoutCoordinates}
            onChange={handleScreenLayoutCoordinatesSwitch}
          />
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsView;
