import { FieldType } from '../../config/constants';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface FormFieldConditional {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: any;
  action: 'show' | 'hide' | 'require';
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  conditional?: FormFieldConditional;
  order: number;
  width?: 'full' | 'half' | 'third';
  properties?: Record<string, any>;
}

export interface CreateFormInput {
  name: string;
  description?: string;
  fields?: FormField[];
  settings?: Record<string, any>;
}

export interface UpdateFormInput {
  name?: string;
  description?: string;
  fields?: FormField[];
  settings?: Record<string, any>;
  isPublished?: boolean;
  isActive?: boolean;
}

export interface FormListResponse {
  id: string;
  name: string;
  description: string | null;
  fieldsCount: number;
  isPublished: boolean;
  isActive: boolean;
  leadsCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormDetailResponse extends FormListResponse {
  fields: FormField[];
  settings: Record<string, any>;
  organizationId: string;
}