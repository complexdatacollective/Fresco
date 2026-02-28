import { Eye, EyeOff, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IconButton } from '~/components/ui/Button';
import ProgressBar from '~/components/ui/ProgressBar';
import InputField from '~/lib/form/components/fields/InputField';
import { cx } from '~/utils/cva';
import { getPasswordStrength } from '~/app/(blobs)/(setup)/_components/getPasswordStrength';

type PasswordFieldProps = React.ComponentProps<typeof InputField> & {
  showStrengthMeter?: boolean;
};

export default function PasswordField({
  showStrengthMeter,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(
    () =>
      showStrengthMeter ? getPasswordStrength(String(props.value ?? '')) : null,
    [showStrengthMeter, props.value],
  );

  return (
    <div className="flex flex-col gap-1">
      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
        prefixComponent={<Lock />}
        suffixComponent={
          <IconButton
            variant="text"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            icon={showPassword ? <EyeOff /> : <Eye />}
          />
        }
        {...props}
      />
      {showStrengthMeter && strength && strength.score > 0 && (
        <div
          className={cx(
            'flex items-center gap-2 transition-colors duration-200',
            strength.colorClass,
          )}
          aria-live="polite"
        >
          <div className="h-1.5 grow">
            <ProgressBar
              orientation="horizontal"
              percentProgress={strength.percent}
              nudge={false}
              label="Password strength"
            />
          </div>
          <span className="text-xs font-medium">{strength.label}</span>
        </div>
      )}
    </div>
  );
}
