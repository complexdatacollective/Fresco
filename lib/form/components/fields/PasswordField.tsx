import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { InputField } from './InputField';

export default function PasswordField(
  props: React.ComponentProps<typeof InputField>,
) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <InputField
      type={showPassword ? 'text' : 'password'}
      placeholder="Enter password"
      prefixComponent={<Lock className="h-4 w-4" />}
      suffixComponent={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="hover:text-contrast"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      }
      {...props}
    />
  );
}
