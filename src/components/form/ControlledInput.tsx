import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { Input, type InputProps } from '@/components/ui/Input';

type ControlledInputProps<T extends FieldValues> = Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<T>;
  name: Path<T>;
  error?: string;
};

/** Bridges react-hook-form's Controller to our themed <Input>. */
export function ControlledInput<T extends FieldValues>({
  control,
  name,
  error,
  ...rest
}: ControlledInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          value={(field.value as string) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={error}
          {...rest}
        />
      )}
    />
  );
}
