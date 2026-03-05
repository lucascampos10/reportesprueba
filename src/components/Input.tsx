import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, leftIcon, rightIcon, helperText, id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const errorId = error ? `${inputId}-error` : undefined;

        return (
            <div className={`input-wrapper ${className}`}>
                {label && (
                    <label htmlFor={inputId} className="input-label">
                        {label}
                    </label>
                )}

                <div className={`input-container ${error ? 'input-error' : ''} ${props.disabled ? 'input-disabled' : ''}`}>
                    {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}

                    <input
                        ref={ref}
                        id={inputId}
                        className={`input-field ${leftIcon ? 'with-left-icon' : ''} ${rightIcon ? 'with-right-icon' : ''}`}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={errorId}
                        {...props}
                    />

                    {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
                </div>

                {error && (
                    <p id={errorId} className="input-error-text" role="alert">
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p className="input-helper-text">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
