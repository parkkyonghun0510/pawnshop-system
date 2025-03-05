type ValidationRule = {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    phone?: boolean;
    custom?: (value: any) => boolean | string;
    message?: string;
};

type ValidationRules = {
    [key: string]: ValidationRule;
};

type ValidationResult = {
    isValid: boolean;
    errors: { [key: string]: string };
};

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_REGEX = /^\+?[\d\s-]{10,}$/;

export const validate = (data: any, rules: ValidationRules): ValidationResult => {
    const errors: { [key: string]: string } = {};

    Object.entries(rules).forEach(([field, rule]) => {
        const value = data[field];

        // Required check
        if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
            errors[field] = rule.message || 'This field is required';
            return;
        }

        if (value) {
            // Minimum length check
            if (rule.minLength && value.length < rule.minLength) {
                errors[field] = rule.message || `Minimum length is ${rule.minLength} characters`;
                return;
            }

            // Maximum length check
            if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = rule.message || `Maximum length is ${rule.maxLength} characters`;
                return;
            }

            // Pattern check
            if (rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.message || 'Invalid format';
                return;
            }

            // Email check
            if (rule.email && !EMAIL_REGEX.test(value)) {
                errors[field] = rule.message || 'Invalid email address';
                return;
            }

            // Phone check
            if (rule.phone && !PHONE_REGEX.test(value)) {
                errors[field] = rule.message || 'Invalid phone number';
                return;
            }

            // Custom validation
            if (rule.custom) {
                const result = rule.custom(value);
                if (result !== true) {
                    errors[field] = typeof result === 'string' ? result : (rule.message || 'Invalid value');
                    return;
                }
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

// Common validation rules
export const commonRules = {
    required: { required: true },
    email: { email: true, required: true },
    phone: { phone: true, required: true },
    password: {
        required: true,
        minLength: 8,
        pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
        message: 'Password must be at least 8 characters and contain letters and numbers',
    },
    name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[A-Za-z\s'-]+$/,
        message: 'Please enter a valid name',
    },
};

// Example usage:
// const customerRules = {
//     first_name: commonRules.name,
//     last_name: commonRules.name,
//     email: commonRules.email,
//     phone: commonRules.phone,
// }; 