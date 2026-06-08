import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon";
import IC from "../../components/IC";
import StudentRegistrationWizard from "../../components/StudentRegistrationWizard";

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 dark:bg-dark-card-bg md:p-6">
      <button
        type="button"
        onClick={() => navigate("/admin/student")}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-default bg-bg-shell px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-hover dark:border-dark-default dark:bg-dark-shell dark:text-dark-secondary dark:hover:bg-dark-hover"
      >
        <Icon d={IC.chevLeft} className="size-3.5 stroke-[2]" />
        {t("studentForm.actions.back")}
      </button>
      <StudentRegistrationWizard
        onCompleted={() => navigate("/admin/student")}
      />
    </div>
  );
}
