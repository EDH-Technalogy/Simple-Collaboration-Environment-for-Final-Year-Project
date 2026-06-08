import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon";
import IC from "../../components/IC";
import EmployeeRegistrationWizard from "../../components/EmployeeRegistrationWizard";

export default function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 dark:bg-dark-card-bg md:p-6">
      <button
        type="button"
        onClick={() =>
          navigate(id ? `/admin/employee/${id}` : "/admin/employee")
        }
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-default bg-light-card-bg px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-light-card-hover dark:border-dark-default dark:bg-dark-card-bg dark:text-dark-secondary dark:hover:bg-dark-card-hover"
      >
        <Icon d={IC.chevLeft} className="size-3.5 stroke-[2]" />
        {t("employeeForm.actions.backToList")}
      </button>
      <EmployeeRegistrationWizard
        mode="edit"
        employeeId={id}
        onCompleted={() => navigate(`/admin/employee/${id}`)}
      />
    </div>
  );
}
