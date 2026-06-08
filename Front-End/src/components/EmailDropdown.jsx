import { useState } from "react";
import IC from "./IC";
import Icon from "./Icon";
import Dropdown from "./Dropdown";
import Avatar from "./Avatar";
export default function EmailDropdown({ onClose }) {
  const EMAILS = [
    {
      id: 1,
      from: "Emily Carter",
      avatar: "EC",
      color: "bg-pink-500",
      subject: "Assignment submission reminder",
      preview: "Please remind students that assignments are due by Friday EOD.",
      time: "09:41 AM",
      unread: true,
    },
    {
      id: 2,
      from: "Principal Hassan",
      avatar: "PH",
      color: "bg-indigo-600",
      subject: "Staff meeting – March 10",
      preview:
        "All teaching staff are required to attend the meeting in Hall B.",
      time: "08:15 AM",
      unread: true,
    },
    {
      id: 3,
      from: "Matthew Johnson",
      avatar: "MJ",
      color: "bg-teal-500",
      subject: "Re: Physics lab schedule",
      preview: "Thanks for the update! I'll confirm the lab booking today.",
      time: "Yesterday",
      unread: false,
    },
    {
      id: 4,
      from: "School Admin",
      avatar: "AD",
      color: "bg-violet-500",
      subject: "Updated timetable – Term 2",
      preview: "Please find the revised timetable for Term 2 attached.",
      time: "Yesterday",
      unread: false,
    },
    {
      id: 5,
      from: "Laura Miller",
      avatar: "LM",
      color: "bg-orange-400",
      subject: "Student behaviour incident",
      preview:
        "I wanted to flag an issue that occurred during 3rd period today.",
      time: "Mar 3",
      unread: false,
    },
  ];
  const [emails, setEmails] = useState(EMAILS);
  const [search, setSearch] = useState("");

  const unreadCount = emails.filter((e) => e.unread).length;
  const filtered = emails.filter(
    (e) =>
      e.from.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()),
  );

  const markRead = (id) =>
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, unread: false } : e)),
    );

  return (
    <Dropdown className="w-85 sm:w-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-default dark:border-dark-default">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary dark:text-dark-primary">
            Messages
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent dark:bg-dark-accent/20 dark:text-dark-accent leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[11px] text-accent dark:text-dark-accent hover:underline font-medium">
            Compose
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-hover dark:hover:bg-dark-hover text-muted dark:text-dark-muted"
          >
            <Icon
              d={IC.close ?? "M18 6L6 18M6 6l12 12"}
              className="size-3.5 stroke-2"
            />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b border-default dark:border-dark-default">
        <div className="relative">
          <Icon
            d={IC.search}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 stroke-muted dark:stroke-dark-muted stroke-2 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-input dark:bg-dark-input border border-default dark:border-dark-default text-primary dark:text-dark-primary placeholder:text-muted dark:placeholder:text-dark-muted outline-none focus:border-accent dark:focus:border-dark-accent transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <ul className="max-h-80 overflow-y-auto divide-y divide-border-light dark:divide-dark-border-light">
        {filtered.length === 0 ? (
          <li className="py-10 text-center text-xs text-muted dark:text-dark-muted">
            No messages found
          </li>
        ) : (
          filtered.map((email) => (
            <li
              key={email.id}
              onClick={() => markRead(email.id)}
              className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-hover dark:hover:bg-dark-hover ${
                email.unread ? "bg-accent/4 dark:bg-dark-accent/6" : ""
              }`}
            >
              <Avatar
                initials={email.avatar}
                colorClass={email.color}
                size="w-8 h-8"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className={`text-xs font-semibold truncate ${email.unread ? "text-primary dark:text-dark-primary" : "text-secondary dark:text-dark-secondary"}`}
                  >
                    {email.from}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted dark:text-dark-muted">
                      {email.time}
                    </span>
                    {email.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-dark-accent" />
                    )}
                  </div>
                </div>
                <p
                  className={`text-[11px] font-medium truncate ${email.unread ? "text-secondary dark:text-dark-secondary" : "text-muted dark:text-dark-muted"}`}
                >
                  {email.subject}
                </p>
                <p className="text-[11px] text-muted dark:text-dark-muted mt-0.5 truncate">
                  {email.preview}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-default dark:border-dark-default flex items-center justify-between">
        <button className="text-xs text-accent dark:text-dark-accent font-medium hover:underline">
          View all messages →
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted dark:text-dark-muted hover:text-secondary dark:hover:text-dark-secondary">
          <Icon
            d={IC.settings ?? "M12 15a3 3 0 100-6 3 3 0 000 6z"}
            className="size-3 stroke-[1.5]"
          />
          Settings
        </button>
      </div>
    </Dropdown>
  );
}
