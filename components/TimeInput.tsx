import { TextField } from '@mui/material';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { secondsToTime, timeToSeconds } from '../utils/download';

interface TimeInputProps {
  name: 'startTime' | 'endTime';
  label: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const TimeInput: React.FC<TimeInputProps> = ({ name, label, onFocus, onBlur }) => {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext();

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string
  ) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }

    // Prevent the default cursor movement
    event.preventDefault();

    const currentSeconds = timeToSeconds(currentValue);
    const newSeconds = event.key === 'ArrowUp' ? currentSeconds + 1 : currentSeconds - 1;

    // Prevent time from going below zero
    if (newSeconds < 0) {
      return;
    }

    const newTime = secondsToTime(newSeconds);

    // Update the form state and trigger validation
    setValue(name, newTime, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          onKeyDown={(e) => handleKeyDown(e, field.value)}
          error={!!errors[name]}
          onFocus={onFocus}
          onBlur={onBlur}
          helperText={errors[name]?.message as string}
          fullWidth
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
        />
      )}
    />
  );
};