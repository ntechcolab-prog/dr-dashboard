import { ButtonProps } from '@mui/material';
import { CheckboxProps as CheckboxProps_2 } from '@mui/material';
import { Dayjs } from 'dayjs';
import { DialogProps as DialogProps_2 } from '@mui/material/Dialog';
import { FC } from 'react';
import { JSX } from 'react/jsx-runtime';
import { MemoExoticComponent } from 'react';
import { PropsWithChildren } from 'react';
import { RadioProps } from '@mui/material';
import { ReactNode } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { SelectProps as SelectProps_2 } from '@mui/material';
import { SnackbarProps } from '@mui/material';
import { StackProps } from '@mui/material';
import { SvgIconProps } from '@mui/material';
import { SxProps } from '@mui/material/styles';
import { SxProps as SxProps_2 } from '@mui/material';
import { TextFieldProps as TextFieldProps_2 } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { Theme as Theme_2 } from '@mui/material';
import { TooltipProps } from '@mui/material';

export declare const AlertBar: typeof AlertBar_2;

/**
 * AlertBar component
 */
declare function AlertBar_2({ isOpen, setOpen, type, text, time, ...props }: AlertBarProps): JSX.Element;

export declare interface AlertBarProps extends SnackbarProps {
    /**
     * state of alert as open or closed
     */
    isOpen: boolean;
    /**
     * set status of alert as open or closed
     * @param isOpen
     */
    setOpen: (isOpen: boolean) => void;
    /**
     * type of alert: <caption>@type 'error' | 'warning' | 'info' | 'success'
     */
    type: "error" | "warning" | "info" | "success";
    /**
     * text of alert
     */
    text: string;
    /**
     * time in milliseconds to close alert
     */
    time?: number;
}

export declare function AutocompleteSelect<T>(props: AutocompleteSelectProps<T>): JSX.Element;

/**
 * AutocompleteSelectProps is the Autocomplete-based replacement while preserving field names
 * and intent wherever possible.
 *
 * Notes:
 * - `handleChange` now prefers (value, event?) instead of (event).
 *   For compatibility, you may still pass a function that accepts a single `event`,
 *   but it's recommended to update usages to receive the normalized `value`.
 * - `value` may be `null` (cleared) and supports the selected option type.
 */
export declare interface AutocompleteSelectProps<T> {
    /** Input id (used for aria and label association). */
    id: string;
    /** Visual label shown above the input (filled variant). */
    label?: string;
    /** Optional name attribute for forms. */
    name?: string;
    /** Optional CSS class on the root FormControl. */
    className?: string;
    /**
     * Change select handler.
     * Triggered when the user selects an option.
     */
    handleChangeOption?: ((option: T | null, event?: unknown) => void) | ((event: unknown) => void);
    /**
     * Change textfield handler.
     * Triggered when the input value changes (typing).
     */
    handleChangeValue?: (event: string | null) => void;
    /** Whether the control takes the full available width. */
    fullWidth?: boolean;
    /**
     * When true, includes an empty/clearable entry.
     * In Autocomplete this enables clearing and shows a transparent "None" row.
     */
    withEmptyField?: boolean;
    /** MUI FormControl margin. */
    margin?: "none" | "dense" | "normal";
    /** MUI size. */
    size?: "small" | "medium";
    /** Marks the field as required. */
    required?: boolean;
    /** Error state toggler. */
    error?: boolean;
    /** Helper text shown under the field when error is true. */
    helperText?: string;
    /**
     * Current option. For single selection Autocomplete this is the selected option or null.
     * (Kept generic to match your data model.)
     */
    option?: T | null;
    /**
     * Current value. For input text value.
     */
    value?: string | undefined;
    /**
     * Custom dropdown icon component.
     * Using React.ElementType keeps compatibility with MUI icons and inline lambdas.
     */
    IconComponent?: React.ElementType;
    /** Optional custom background color passed to your style helper. */
    bgColor?: string;
    /** Optional icon color, consumed by your style helper. */
    iconColor?: string;
    /** Prevent the icon rotation styling (kept for parity with Select). */
    disableIconRotation?: boolean;
    /** MUI `sx` prop merged with getSelectDefaultSx(...) output. */
    sx?: SxProps<Theme>;
    /** Disable the whole control. */
    disabled?: boolean;
    /** Optional placeholder (shown when no value is selected). */
    placeholder?: string;
    /** Options list used by Autocomplete. */
    options: T[];
    /** How to display an option as string. Defaults to String(option ?? ""). */
    getOptionLabel?: (option: T) => string;
    /** Equality check between option and value. If not provided, a label-based fallback is used. */
    isOptionEqualToValue?: (option: T, value: T) => boolean;
    /** Pass-through for any additional props you may already spread. */
    [key: string]: any;
}

declare enum BATCH_STATUS_ENUM {
    COMPLETED = "COMPLETED",
    CONCLUDED = "CONCLUDED",
    CANCELLED = "CANCELLED",
    IN_OPERATION = "IN_OPERATION",
    COMPLETED_BEFORE_TARGET = "COMPLETED_BEFORE_TARGET",
    COMPLETED_WITH_TARGET_UPDATES = "COMPLETED_WITH_TARGET_UPDATES",
    LOADING = "LOADING",
    STOPPED = "STOPPED",
    UNKNOWN = "UNKNOWN"
}

export declare const BatchStatusChip: FC<BatchStatusChipProps>;

export declare type BatchStatusChipProps = {
    status?: BATCH_STATUS_ENUM | string | null;
    label?: string;
};

export declare const Checkbox: FC<CheckboxProps>;

/**
 * Props for the Checkbox component.
 */
export declare interface CheckboxProps extends CheckboxProps_2 {
    /**
     * Optional additional class name for styling the component.
     */
    className?: string;
    /**
     * If `true`, the checkbox will be disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Label to display next to the checkbox.
     */
    label?: React.ReactNode;
    /**
     * Custom color for the checkbox when it is not disabled.
     * @default theme.palette.primary.main of your project
     */
    activeColor?: string;
}

export declare const CircularLoader: FC<CircularLoaderProps>;

export declare interface CircularLoaderProps {
    /**
     * The color of the CircularProgress component.
     * Can be one of the MUI predefined colors or 'inherit'.
     * - 'primary' (default primary theme color)
     * - 'secondary' (default secondary theme color)
     * - 'error' (error color in the theme)
     * - 'info' (info color in the theme)
     * - 'success' (success color in the theme)
     * - 'warning' (warning color in the theme)
     * - 'inherit' (inherits the color from the parent component)
     */
    color?: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    /**
     * The size of the CircularProgress component in pixels.
     * Default value is 40.
     */
    size?: number;
    /**
     * The thickness of the CircularProgress component.
     * Default value is 3.6.
     */
    thickness?: number;
    /**
     * Determines if the loader should be displayed within the `Wrapper` component.
     * If true, the loader will be centered in a wrapper with minimum height of 80px.
     * Default value is false.
     */
    standalone?: boolean;
}

export declare const CloudflareCaptcha: FC<CloudflareCaptchaProps>;

export declare interface CloudflareCaptchaProps {
    /**
     * Callback function to handle the CAPTCHA verification token
     * @param token - CAPTCHA token generated by Cloudflare Turnstile
     */
    onVerify: (token: string) => void;
    /**
     * Optional callback function to handle expiration of the CAPTCHA token
     */
    onExpire?: () => void;
    /**
     * Unique site key provided by Cloudflare for Turnstile
     */
    siteKey: string;
    /**
     * Id attribute necessary to render the widget according to CloudFlare documentation
     */
    id: string;
}

export declare interface Column<T> {
    field: string;
    label?: string;
    sort?: boolean;
    align?: "right" | "left" | "center" | "justify" | "inherit" | undefined;
    size?: string;
    hasAction?: boolean;
    render?: (ds: T) => React.ReactNode;
}

export declare const DateRangeCalendar: MemoExoticComponent<({ returnType, handleDates, selectedDates, maxDays, blockAfterToday, language, }: DateRangeCalendarProps) => JSX.Element>;

export declare interface DateRangeCalendarProps {
    /**
     * The type of date that will be returned in `handleDates` method.
     * It can be `string` to return an ISO string, or `date` to return a `Date` object.
     */
    returnType?: "string" | "date";
    /**
     * Method that will receive `HandleDatesProps`,
     * inside this method you can receive `startDate` and `endDate` to use it inside your component
     */
    handleDates: (dates: HandleDatesProps) => void;
    /**
     * Variable that receive a state in `HandleDatesProps` format
     */
    selectedDates?: HandleDatesProps;
    /**
     * Maximum number of days that an user can select.
     */
    maxDays?: number;
    /**
     * If `true` the user can't select a date after today.
     */
    blockAfterToday?: boolean;
    /**
     * Language of the calendar.
     */
    language?: "en-gb" | "pt_BR" | "de_DE" | "es_ES";
}

export declare interface Dates {
    startDate?: Dayjs;
    endDate?: Dayjs;
}

export declare const DateTimeDialog: FC<DateTimeDialogProps>;

export declare interface DateTimeDialogProps {
    open: boolean;
    handleClose: () => void;
    title?: string;
    subTitle?: string;
    startTimeCaption: string;
    endTimeCaption: string;
    cancelCaption: string;
    okCaption: string;
    setValues: (startIso: string, endIso: string, startDate: Date, endDate: Date) => void;
    handleApply?: () => void;
    showTimePicker?: boolean;
    maxDays?: number;
    /**
     * Language of the calendar.
     * Supported values: "en-gb", "pt_BR", "de_DE", "es_ES".
     *
     * Example using i18next:
     *
     *   const { i18n } = useTranslation();
     *   const currentLang = i18n.language;
     */
    language: "en-gb" | "pt_BR" | "de_DE" | "es_ES";
}

export declare const DateTimeField: typeof DateTimeField_2;

declare function DateTimeField_2({ id, label, required, value, error, helperText, onChange, maxDays, language, startTimeCaption, endTimeCaption, cancelCaption, okCaption, title, subTitle }: DateTimeFieldProps): JSX.Element;

export declare interface DateTimeFieldProps {
    id: string;
    label: string;
    required: boolean;
    value: string;
    error: boolean;
    helperText: string;
    onChange: (startDate: string, endDate: string) => void;
    maxDays?: number;
    language: 'en-gb' | 'pt_BR' | 'de_DE' | 'es_ES';
    startTimeCaption: string;
    endTimeCaption: string;
    cancelCaption: string;
    okCaption: string;
    title?: string;
    subTitle?: string;
}

declare interface DefaultSort {
    field: SortField;
    order: Order;
}

export declare const DialCodes: {
    name: string;
    dial_code: string;
    code: string;
}[];

export declare const Dialog: typeof Dialog_2;

/**
 * Shared Dialog component using Material UI and design system defaults.
 * Supports custom action bar, responsive sizing, and loading states.
 */
declare function Dialog_2({ open, canSave, isSaving, handleClose, handleCancel, handleOk, title, titleFontSize, subTitle, content, cancelCaption, okCaption, actionBar, minHeight, maxHeight, minWidth, maxWidth, width, scroll, paddingXContent, paddingYContent, displayActionBar, justifyContentActionBar, className, ...muiDialogProps }: PropsWithChildren<DialogProps>): JSX.Element;

export declare interface DialogProps extends Omit<DialogProps_2, 'maxWidth' | 'content'> {
    /**
     * define if the Dialog will be open
     */
    open: boolean;
    /**
     * if you are using default action bar of this component:
     * this property is equals true
     * and property `isSaving` is not true then save button is enabled
     * otherwise isn't.
     *
     * It is very useful for some form validation to not enable save button
     * in case your for didn't pass all validations.
     */
    canSave?: boolean;
    /**
     * if you are using default action bar of this component:
     * It can block save button, so you avoid to call save action
     * when your form is still saving your data.
     */
    isSaving?: boolean;
    /**
     * Default function to close this dialog
     */
    handleClose: () => void;
    /**
     * if you are using default action bar of this component:
     * it defines a default function to `CANCEL` button
     */
    handleCancel?: () => void;
    /**
     * if you are using default action bar of this component:
     * it defines a default function to `OK` button
     */
    handleOk?: () => void;
    /**
     * Dialog title
     */
    title?: string;
    /**
     * Font size title
     * @default 26
     */
    titleFontSize?: number;
    /**
     * Dialog subtitle
     */
    subTitle?: string;
    /**
     * Content of Dialog, its a JSX Element
     */
    content?: React.ReactNode;
    /**
     * if you are using default action bar of this component:
     * Label of `CANCEL` button
     */
    cancelCaption?: string;
    /**
     * if you are using default action bar of this component:
     * Label of `OK` button
     */
    okCaption?: string;
    /**
     * if you DON'T want to use this component action bar
     * You can define yours, its very usefull when your action bar
     * its different then our default action bar patterns
     */
    actionBar?: React.ReactNode;
    /**
     * Minimum height of your dialog
     */
    minHeight?: string;
    /**
     * Max height of your dialog.
     * @default is '100vh'
     */
    maxHeight?: string;
    /**
     * Minimum width of your dialog
     */
    minWidth?: string;
    /**
     * Mas width of your dialog.
     * @default '100vw'
     */
    maxWidth?: string;
    /**
     * Width of your dialog
     */
    width?: string;
    /**
     * Determine the container for scrolling the dialog.
     * @default 'paper'
     */
    scroll?: "body" | "paper" | undefined;
    /**
     * Defines horizontal padding
     */
    paddingXContent?: string;
    /**
     * Defines vertical padding
     */
    paddingYContent?: string;
    /**
     * With this property you can override property `display` of our default dialog.
     * @see https://developer.mozilla.org/docs/Web/CSS/display
     * @default 'flex'
     */
    displayActionBar?: string;
    /**
     * With this property you can override property `justify-content` of our default dialog.
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content
     * @default 'space-between'
     */
    justifyContentActionBar?: string;
    /**
     * Used to override css
     */
    className?: string;
}

export declare interface HandleDatesProps {
    startDate?: Date | string | undefined;
    endDate?: Date | string | undefined;
}

export declare interface IconProps extends SvgIconProps {
    /**
     * Icon name, it must be the name of an existing icon
     */
    name: string;
}

export declare const LoadingButton: FC<LoadingButtonProps>;

/**
 * Props for the LoadingButton component.
 */
export declare interface LoadingButtonProps extends ButtonProps {
    /**
     * Indicates whether the button is in a loading state.
     * @default false
     */
    loading?: boolean;
}

export declare const MultiSelect: FC<MultiSelectProps>;

/**
 * Defines the structure of options that can be selected in the MultiSelect component.
 * - `title`: The display text for the option.
 * - `value`: A unique identifier for the option, which can be a string or number.
 * - `parent` (optional): Additional context or hierarchy information for the option.
 */
export declare interface MultiSelectOption {
    title: string;
    value: string | number;
    parent?: unknown | undefined | null;
}

/**
 * Defines the props accepted by the MultiSelect component.
 *
 * @property {string} id - A unique identifier for the input field.
 * @property {string} label - The label displayed on the input field.
 * @property {string} name - The name of the field (used for form management).
 * @property {MultiSelectOption[]} value - The currently selected options.
 * @property {(field: string, value: MultiSelectOption[]) => void} setFieldValue -
 * A callback function to update the field's value in the parent component.
 * @property {boolean} [fullWidth=false] - Whether the input field should span the full width of its container.
 * @property {MultiSelectOption[]} options - The list of options available for selection.
 * @property {"checkbox" | "option"} [optionType="checkbox"] - The type of options to render (checkboxes or standard list items).
 * @property {SxProps<Theme>} [sx={}] - Custom styles applied to the component.
 * @property {Partial<TextFieldProps["InputProps"]>} [InputProps] - Additional props for customizing the underlying TextField.
 * @property {React.ReactNode} [dropdownIcon] - Custom dropdown icon.
 */
export declare interface MultiSelectProps {
    id: string;
    label: string;
    name: string;
    value: MultiSelectOption[];
    setFieldValue: (field: string, value: MultiSelectOption[]) => void;
    fullWidth?: boolean;
    options: MultiSelectOption[];
    optionType?: "checkbox" | "option";
    sx?: SxProps_2<Theme_2>;
    InputProps?: Partial<TextFieldProps_2["InputProps"]>;
    dropdownIcon?: React.ReactNode;
}

export declare type Order = "asc" | "desc";

export declare const PageHeader: typeof PageHeader_2;

/**
 * PageHeader
 *
 * It's our default page header
 *
 * Also accepts Stack props to better handle this component:
 *
 * - [Stack API](https://mui.com/material-ui/api/stack/)
 */
declare function PageHeader_2({ title, tooltipText, fontSize, ...props }: PageHeaderProps): JSX.Element;

export declare interface PageHeaderProps extends StackProps {
    /**
     * title, it is what will be showed as a title
     */
    title: string;
    /**
     * title size in px, default value is 20px
     */
    fontSize?: number;
    /**
     * tooltipText is what will be showed as tip
     */
    tooltipText: string;
}

export declare const RadioButton: FC<RadioButtonProps>;

/**
 * Props for the RadioButton component.
 *
 * @property {boolean} [disabled=false] - Specifies if the radio button is disabled.
 * @property {string} [activeColor] - The color applied to the radio button when active and not disabled.
 */
export declare interface RadioButtonProps extends Omit<RadioProps, "color"> {
    disabled?: boolean;
    activeColor?: string;
}

export declare const Select: FC<SelectProps>;

/**
 * Props for the Select component
 */
export declare interface SelectProps extends Omit<SelectProps_2, "onChange" | "value"> {
    /** Unique identifier for the select component */
    id: string;
    /** Label displayed for the select input */
    label: string;
    /** Child components, usually <MenuItem> elements */
    children: ReactNode;
    /** Additional CSS class applied to the component */
    className?: string;
    /** Function to handle changes in selection */
    handleChange: (event: SelectChangeEvent<unknown>) => void;
    /** If true, the select input takes the full width of its container */
    fullWidth?: boolean;
    /** If true, includes an empty field option at the beginning */
    withEmptyField?: boolean;
    /** Sets the margin of the select input */
    margin?: "none" | "dense";
    /** If true, marks the field as required */
    required?: boolean;
    /** Sets the size of the select input, can be "small" or "medium" */
    size?: "small" | "medium";
    /** If true, displays the select input in an error state */
    error?: boolean;
    /** Helper text displayed below the select input */
    helperText?: string;
    /** The currently selected value */
    value: string | number | undefined;
    /** Custom icon component for the dropdown indicator, accepts a Material-UI icon component or a custom component */
    IconComponent?: React.ElementType;
    /** Background color of the select input */
    bgColor?: string;
    /** Color of the dropdown indicator icon */
    iconColor?: string;
    /** If true, disables the rotation of the dropdown indicator icon */
    disableIconRotation?: boolean;
}

declare type ShowAlertOptions = Omit<AlertBarProps, 'isOpen' | 'setOpen'>;

export declare const SingleLineTabs: FC<SingleLineTabsProps>;

export declare interface SingleLineTabsProps {
    /**
     * Array of tab content.
     * @type TabContent[]
     */
    tabContent: TabContent[];
    /**
     * Custom styles for each tab component.
     * @type Record<string, unknown>
     */
    sx?: Record<string, unknown>;
    /**
     * Object with the index of the selected tab and the time it was selected.
     * Why time? Because the tab component needs to be re-rendered when the index changes.
     * @type { index: number; time: number }
         */
     selectedTab: {
         index: number;
         time: number;
     };
     /**
      * Font size for the tab title.
      * @type string
      */
     fontSizeTabTitle?: string;
    }

    declare type SortField = string | number | symbol | null;

    export declare interface StartEndDates {
        startDate?: string | Date;
        endDate?: string | Date;
    }

    export declare const StaticIcon: typeof StaticIcon_2;

    /**
     * Static SVG component
     *
     * API:
     *
     * - [SvgIcon API](https://mui.com/material-ui/api/svg-icon/)
     */
    declare function StaticIcon_2({ name, ...props }: IconProps): JSX.Element;

    /**
     * Represents the content of a tab.
     * @property title - The title of the tab.
     * @property content - The content of the tab, can be any JSX element or string.
     * @property dataTestId - Optional data-testid attribute for testing purposes.
     */
    export declare interface TabContent {
        dataTestId?: string;
        title: string;
        content: ReactNode;
    }

    export declare function Table<T>(props: TableProps<T>): JSX.Element;

    export declare interface TableProps<T> {
        /**
         * Name one property of `T`
         * that will be the ` key ` property of every table row
         */
        rowKey: string;
        /**
         * Data source of data to show in your table
         */
        dataSource: T[];
        /**
         * Columns of your datasource to be shown
         */
        columns: Column<T>[];
        /**
         * Defines if table footer is shown
         */
        hasFooter?: boolean;
        /**
         * label of footer describing 'itens per page'
         */
        itensPerPageLabel?: string;
        /**
         * label of footer describing, for example, '1 of 2' pages
         */
        itemLabel?: string;
        /**
         * Current page selected
         */
        currentPage?: number;
        /**
         * Total pages of your table
         */
        totalPages?: number;
        /**
         * how many rows to show per page
         */
        rowsPerPage?: number;
        /**
         * Function to handle action of the change page
         */
        handleChangePage?: (page: number) => void;
        /**
         * Function to handle action of table sort
         */
        handleTableSort?: (order: Order, orderBy: keyof T) => void;
        /**
         * If you want to have a how click,
         * Define this function to handle what to do in a row click action
         */
        rowClick?: (row: T) => void;
        /**
         * If you don't have any register in your table, this label can be shown
         */
        noDataMsg?: string;
        /**
         * Default sort configuration for the table.
         * It should contain the column ID and the order (asc or desc).
         * This will be used to set the initial sort state of the table.
         * @default { field: null, order: 'asc' }
         * @example { field: 'name', order: 'asc' }
         */
        defaultSort?: DefaultSort;
    }

    export declare interface TabPanelProps {
        children?: ReactNode;
        value: number;
        index: number;
    }

    export declare const TextField: FC<TextFieldProps>;

    /**
     * Props for the TextField component
     * Extends the Material-UI TextFieldProps with additional customization.
     */
    export declare interface TextFieldProps extends Omit<TextFieldProps_2, "size" | "type"> {
        /** Size of the text field (limited to "small" or "medium" for compatibility) */
        size?: "small" | "medium";
        /** Type of input, such as "text" or "password" */
        type?: string;
        /** Custom styling applied to the component */
        sx?: SxProps_2<Theme_2>;
        /** Background color of the input */
        bgcolor?: string;
    }

    export declare const TooltipInfo: typeof TooltipInfo_2;

    /**
     * TooltipInfo
     *
     * It is an icon with more information for users
     *
     * An override of MUI Tooltip with our style
     *
     * API:
     *
     * - [Tooltip API](https://mui.com/material-ui/api/tooltip/)
     */
    declare function TooltipInfo_2({ title, fontSize, ...props }: TooltipInfoProps): JSX.Element;

    export declare interface TooltipInfoProps extends Omit<TooltipProps, "children"> {
        /**
         * TooltipInfo title, it is what tip will be showed
         */
        title: string;
        /**
         * Icon squared size in px, default value is 20px
         */
        fontSize?: number;
    }

    export declare const useAlertBar: () => {
        showAlert: (options: ShowAlertOptions) => void;
        AlertBarElement: JSX.Element;
    };

    export { }


declare global {
    interface Window {
        turnstile?: Turnstile;
    }
}

