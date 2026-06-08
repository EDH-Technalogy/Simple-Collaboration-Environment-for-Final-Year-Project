import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../../components/Icon";
import IC from "../../components/IC";
import StudentRegistrationWizard from "../../components/StudentRegistrationWizard";

export default function StudentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 dark:bg-dark-card-bg md:p-6">
      <button
        type="button"
        onClick={() => navigate(id ? `/admin/student/${id}` : "/admin/student")}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-(--color-light-card-hover) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary dark:hover:bg-(--color-dark-card-hover)"
      >
        <Icon d={IC.chevLeft} className="size-3.5 stroke-[2]" />
        {t("studentForm.actions.back")}
      </button>
      <StudentRegistrationWizard
        mode="edit"
        studentId={id}
        onCompleted={() => navigate(`/admin/student/${id}`)}
        onCancel={() => navigate(`/admin/student/${id}`)}
      />
    </div>
  );
}
