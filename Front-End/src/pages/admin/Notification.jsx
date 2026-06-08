import AdminNotificationInboxTable from "../../components/admin/AdminNotificationInboxTable";

/** Admin notifications as a data table (parity with Students UI). */
export default function Notification() {
  return (
    <div className=" w-full bg-white dark:bg-dark-card-bg min-h-screen">
      <AdminNotificationInboxTable basePath="/admin/notification" />;
    </div>
  );
}
