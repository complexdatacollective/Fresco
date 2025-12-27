import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';

export default function PasswordField(
  props: React.ComponentProps<typeof InputField>,
) {
  const [showPassword, setShowPassword] = useState(false);
  return (
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
  );
}
