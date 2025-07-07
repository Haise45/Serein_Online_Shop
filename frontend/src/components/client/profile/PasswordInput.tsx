import { useTranslations } from "next-intl";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}) => {
  const t = useTranslations("PasswordInput");

  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field pr-10"
          required
          placeholder={placeholder || "••••••••"}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-indigo-600 focus:outline-none"
          aria-label={show ? t("hidePassword") : t("showPassword")}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
