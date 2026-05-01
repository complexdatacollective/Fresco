'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Surface from '@codaco/fresco-ui/layout/Surface';
import Field from '@codaco/fresco-ui/form/Field/Field';
import FieldGroup from '@codaco/fresco-ui/form/FieldGroup';
import BooleanField from '@codaco/fresco-ui/form/fields/Boolean';
import RadioGroupField from '@codaco/fresco-ui/form/fields/RadioGroup';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

type NodeOption = {
  value: string;
  label: string;
};

type BioTriadConfig = {
  existingNodes?: NodeOption[];
  preselection?: {
    eggSource?: string;
    spermSource?: string;
    carrier?: string;
  };
};

const BioTriadConfigContext = createContext<BioTriadConfig>({});

function BioTriadConfigProvider({
  value,
  children,
}: {
  value: BioTriadConfig;
  children: ReactNode;
}) {
  return (
    <BioTriadConfigContext.Provider value={value}>
      {children}
    </BioTriadConfigContext.Provider>
  );
}

function useBioTriadConfig() {
  return useContext(BioTriadConfigContext);
}

type ParentSectionProps = {
  roleKey: string;
  roleLabel: string;
  selectLabel: string;
  selectHint: string;
  donorFieldName: string;
  donorLabel: string;
  options: NodeOption[];
  initialValue?: string;
  carriedFieldName?: string;
  carriedLabel?: string;
  carriedHint?: string;
};

function ParentSection({
  roleKey,
  roleLabel,
  selectLabel,
  selectHint,
  donorFieldName,
  donorLabel,
  options,
  initialValue,
  carriedFieldName,
  carriedLabel,
  carriedHint,
}: ParentSectionProps) {
  const onlyNewOption = options.length === 1 && options[0]?.value === 'new';

  return (
    <Surface level={1} spacing="sm" noContainer>
      <Heading level="h4">{roleLabel}</Heading>
      {onlyNewOption ? (
        <div className="hidden">
          <Field
            name={roleKey}
            label={roleLabel}
            component={RadioGroupField}
            options={[{ value: 'new', label: 'new' }]}
            initialValue="new"
          />
        </div>
      ) : (
        <Field
          name={roleKey}
          label={selectLabel}
          hint={selectHint}
          component={RadioGroupField}
          options={options}
          initialValue={initialValue}
          required
        />
      )}
      <FieldGroup
        watch={[roleKey]}
        condition={(values) => values[roleKey] === 'new'}
      >
        <PersonFields namespace={`new-${roleKey}`} />
      </FieldGroup>
      <FieldGroup
        watch={[roleKey]}
        condition={(values) =>
          values[roleKey] !== undefined && values[roleKey] !== null
        }
      >
        <Field
          name={donorFieldName}
          label={donorLabel}
          component={BooleanField}
          initialValue={false}
          required
        />
        {carriedFieldName && carriedLabel && (
          <Field
            name={carriedFieldName}
            label={carriedLabel}
            hint={carriedHint}
            component={BooleanField}
            initialValue={true}
            required
          />
        )}
      </FieldGroup>
    </Surface>
  );
}

export default function BioTriadStep() {
  const { existingNodes, preselection } = useBioTriadConfig();
  const nodeOptions = useMemo(() => existingNodes ?? [], [existingNodes]);

  const parentOptions = useMemo(
    () => [...nodeOptions, { value: 'new', label: 'Create a new person' }],
    [nodeOptions],
  );

  const carrierOptions = useMemo(
    () => [...nodeOptions, { value: 'new', label: 'Create a new person' }],
    [nodeOptions],
  );

  const carrierOnlyNewOption =
    carrierOptions.length === 1 && carrierOptions[0]?.value === 'new';

  return (
    <div className="flex flex-col gap-6">
      <ParentSection
        roleKey="egg-source"
        roleLabel="Egg Parent"
        selectLabel="Who provided the egg?"
        selectHint="Select the person who contributed the egg. If this was an egg donor, you can indicate that below."
        donorFieldName="egg-source-is-donor"
        donorLabel="Was this person an egg donor?"
        options={parentOptions}
        initialValue={preselection?.eggSource}
        carriedFieldName="egg-parent-carried"
        carriedLabel="Did this person carry the pregnancy?"
        carriedHint="If someone else carried the pregnancy (e.g. a gestational carrier or surrogate), select 'No'."
      />

      <FieldGroup
        watch={['egg-parent-carried']}
        condition={(values) => values['egg-parent-carried'] === false}
      >
        <Surface level={1} spacing="sm" noContainer>
          <Heading level="h4">Gestational Carrier</Heading>
          {carrierOnlyNewOption ? (
            <div className="hidden">
              <Field
                name="carrier-source"
                label="Gestational Carrier"
                component={RadioGroupField}
                options={[{ value: 'new', label: 'new' }]}
                initialValue="new"
              />
            </div>
          ) : (
            <Field
              name="carrier-source"
              label="Who carried the pregnancy?"
              hint="Select the person who carried the pregnancy, or create a new person."
              component={RadioGroupField}
              options={carrierOptions}
              initialValue={preselection?.carrier}
              required
            />
          )}
          <FieldGroup
            watch={['carrier-source']}
            condition={(values) => values['carrier-source'] === 'new'}
          >
            <PersonFields namespace="new-carrier" />
          </FieldGroup>
          <FieldGroup
            watch={['carrier-source']}
            condition={(values) =>
              values['carrier-source'] !== undefined &&
              values['carrier-source'] !== null
            }
          >
            <Field
              name="carrier-is-surrogate"
              label="Was this person a gestational surrogate?"
              hint="A surrogate carries a pregnancy on behalf of someone else. Select 'Yes' if this person was not the intended parent."
              component={BooleanField}
              initialValue={false}
              required
            />
          </FieldGroup>
        </Surface>
      </FieldGroup>

      <ParentSection
        roleKey="sperm-source"
        roleLabel="Sperm Parent"
        selectLabel="Who provided the sperm?"
        selectHint="Select the person who contributed the sperm. If this was a sperm donor, you can indicate that below."
        donorFieldName="sperm-source-is-donor"
        donorLabel="Was this person a sperm donor?"
        options={parentOptions}
        initialValue={preselection?.spermSource}
      />
    </div>
  );
}

export { BioTriadConfigContext, BioTriadConfigProvider };
export type { BioTriadConfig };
