/**
 * Shared API / toast strings merged into i18n `translation` for en, ps, prs.
 * Operation-specific keys live in `apiErrors.*.generated.json` (from apiRoute throw sites).
 */
export default {
  en: {
    "apiErrors.generic": "Something went wrong. Please try again.",
    "apiErrors.requestFailed": "Request failed.",
    "apiErrors.network": "Check your internet connection and try again.",
    "apiErrors.timeout": "The request took too long. Try again.",
    "apiErrors.http.400": "Invalid request.",
    "apiErrors.http.401": "Sign in again or your session has expired.",
    "apiErrors.http.403": "You don't have permission for this action.",
    "apiErrors.http.404": "We couldn't find that resource.",
    "apiErrors.http.409": "This data changed. Refresh and try again.",
    "apiErrors.http.422": "Some fields need to be corrected.",
    "apiErrors.http.429": "Too many attempts. Please wait a moment.",
    "apiErrors.http.500": "Server error. Please try again later.",
    "apiErrors.http.502": "Service is temporarily unavailable.",
    "apiErrors.http.503": "Service unavailable. Try again later.",
    "apiErrors.validation.emailUsernamePasswordRequired":
      "Email/username and password are required.",
    "apiErrors.validation.fullNameEmailPasswordRequired":
      "Full name, email, and password are required.",
    "apiErrors.validation.refreshTokenRequired": "Refresh token is required.",
    "apiErrors.validation.emailRequired": "Email is required.",
    "apiErrors.validation.invalidResetTokenOrPasswordMismatch":
      "Invalid reset link or passwords do not match.",
    "apiErrors.validation.verificationTokenRequired":
      "Verification token is required.",
    "apiErrors.validation.invalidPasswords": "Passwords are not valid.",
    "apiErrors.validation.vc.milestoneTitleRequired": "Milestone title is required.",
    "apiErrors.validation.vc.milestoneTitleMaxLen": "Milestone title is too long.",
    "apiErrors.validation.vc.milestoneDescriptionMaxLen":
      "Milestone description is too long.",
    "apiErrors.validation.vc.milestoneRubricMaxLen": "Rubric text is too long.",
    "apiErrors.validation.vc.milestoneDueDateInvalid": "Due date is not a valid date.",
    "apiErrors.validation.vc.milestoneScoresInvalid":
      "Scores must be whole numbers between 0 and the allowed maximum.",
    "apiErrors.validation.vc.milestonePassingExceedsMax":
      "Passing score cannot be greater than maximum score.",
    "apiErrors.validation.vc.milestoneRequiredTasksInvalid":
      "Required tasks must be a whole number in the allowed range.",
    "apiErrors.validation.vc.taskTitleRequired": "Task title is required.",
    "apiErrors.validation.vc.taskTitleMaxLen": "Task title is too long.",
    "apiErrors.validation.vc.taskDescriptionMaxLen": "Task description is too long.",
    "apiErrors.validation.vc.taskMilestoneNumberInvalid":
      "Milestone number must be a positive whole number.",
    "apiErrors.validation.vc.taskPriorityInvalid":
      "Choose a valid priority (low, medium, high, critical).",
    "apiErrors.validation.vc.taskLabelsInvalid":
      "Labels must be chosen from the supported list.",
    "apiErrors.validation.vc.taskDueDateInvalid": "Due date is not valid.",
    "apiErrors.validation.vc.taskNumericFieldInvalid":
      "Hours and scores must be valid whole numbers.",
    "apiErrors.validation.vc.taskRequirementsInvalid":
      "Requirements checklist is too long or invalid.",
    "apiErrors.validation.vc.submissionDescriptionMaxLen":
      "Submission description is too long.",
    "apiErrors.validation.vc.submissionBranchInvalid": "Branch name is invalid.",
    "apiErrors.validation.vc.submissionCommitInvalid":
      "Commit hash must be a 7–128 character hexadecimal value.",
    "apiErrors.validation.vc.submissionUrlInvalid":
      "Pull request URL must be a valid http(s) link.",
    "apiErrors.validation.vc.submissionPullRequestIdInvalid":
      "Pull request id must be a positive whole number.",
    "apiErrors.validation.vc.submissionFilesInvalid":
      "File list is too long or contains invalid entries.",
    "apiErrors.validation.vc.submissionNeedsArtifact":
      "Add a pull request id, PR link, description, branch, commit, or file paths.",
    "apiErrors.validation.vc.reviewFeedbackMaxLen": "Review feedback is too long.",
    "apiErrors.validation.vc.reviewScoreInvalid":
      "Review score must be a whole number in the allowed range.",
    "apiErrors.validation.vc.reviewChecklistInvalid": "Requirement checklist is invalid.",
    "apiErrors.validation.vc.reviewPullRequestIdInvalid":
      "Pull request id must be a positive whole number.",
    "apiErrors.validation.vc.assignUsernameInvalid": "Username format is invalid.",
    "apiErrors.failed_to_load_session": "Could not load your session.",
    "apiErrors.failed_to_load_stats": "Could not load statistics.",
    "apiErrors.failed_to_load_file": "Could not load the file.",
    "apiErrors.failed_to_search_repositories":
      "Could not search repositories. Try another keyword.",
    "apiErrors.failed_to_mark_notification_read":
      "Could not mark the notification as read.",
    "apiSuccess.completed": "Completed successfully.",
  },
  ps: {
    "apiErrors.generic": "ستونزه رامنځته شوه. بیا هڅه وکړئ.",
    "apiErrors.requestFailed": "غوښتنه ناکامه وه.",
    "apiErrors.network": "خپل انټرنټ وګورئ او بیا هڅه وکړئ.",
    "apiErrors.timeout": "غوښتنه ډېره اوږده وه. بیا هڅه وکړئ.",
    "apiErrors.http.400": "ناسمه غوښتنه.",
    "apiErrors.http.401": "بیا ننوځئ یا ستاسو ناسته پای ته رسېدلې.",
    "apiErrors.http.403": "تاسو دې کړنې اجازه نلرئ.",
    "apiErrors.http.404": "په لټه کې هغه شتون و نه موندل شو.",
    "apiErrors.http.409": "ډیټا بدل شوې. تازه کړئ او بیا هڅه وکړئ.",
    "apiErrors.http.422": "ځینې ساحې باید سمې شي.",
    "apiErrors.http.429": "ډېرې هڅې. لنډ وخت وروسته بیا هڅه وکړئ.",
    "apiErrors.http.500": "سرور ستونزه. وروسته بیا هڅه وکړئ.",
    "apiErrors.http.502": "خدمت په لنډمهال کې شتون نلري.",
    "apiErrors.http.503": "خدمت شتون نلري. وروسته بیا هڅه وکړئ.",
    "apiErrors.validation.emailUsernamePasswordRequired":
      "برېښناليک/کارن نوم او پټنوم پکار دي.",
    "apiErrors.validation.fullNameEmailPasswordRequired":
      "بشپړ نوم، برېښناليک او پټنوم پکار دي.",
    "apiErrors.validation.refreshTokenRequired": "تازه توکن پکار دی.",
    "apiErrors.validation.emailRequired": "برېښناليک پکار دی.",
    "apiErrors.validation.invalidResetTokenOrPasswordMismatch":
      "موازي لینک ناسم دی یا پټنومونه سره اوښتي نه.",
    "apiErrors.validation.verificationTokenRequired":
      "د تایید توکن پکار دی.",
    "apiErrors.validation.invalidPasswords": "پټنومونه سم نه دي.",
    "apiErrors.validation.vc.milestoneTitleRequired": "د پړاو سرلیک پکار دی.",
    "apiErrors.validation.vc.milestoneTitleMaxLen": "د پړاو سرلیک ډېر اوږد دی.",
    "apiErrors.validation.vc.milestoneDescriptionMaxLen":
      "د پړاو تشریح ډېره اوږده ده.",
    "apiErrors.validation.vc.milestoneRubricMaxLen": "د معیار متن ډېر اوږد دی.",
    "apiErrors.validation.vc.milestoneDueDateInvalid": "د نیټې پای ناسم دی.",
    "apiErrors.validation.vc.milestoneScoresInvalid":
      "نمرې باید بشپړ عددونه وي او د اجازې حد کې وي.",
    "apiErrors.validation.vc.milestonePassingExceedsMax":
      "د بریالۍ نمرې نشي د اعظمي نمرې څخه زیاتې وي.",
    "apiErrors.validation.vc.milestoneRequiredTasksInvalid":
      "د اړینو دندو شمېر باید د اجازې حد کې بشپړ عدد وي.",
    "apiErrors.validation.vc.taskTitleRequired": "د دندې سرلیک پکار دی.",
    "apiErrors.validation.vc.taskTitleMaxLen": "د دندې سرلیک ډېر اوږد دی.",
    "apiErrors.validation.vc.taskDescriptionMaxLen": "د دندې تشریح ډېره اوږده ده.",
    "apiErrors.validation.vc.taskMilestoneNumberInvalid":
      "د پړاو شمېر باید مثبت بشپړ عدد وي.",
    "apiErrors.validation.vc.taskPriorityInvalid":
      "د پام وړ لومړیتوب وټاکئ (ټیټ، منځنی، لوړ، ګړندی).",
    "apiErrors.validation.vc.taskLabelsInvalid":
      "نیټونه باید د ملاتړ شویو څخه وي.",
    "apiErrors.validation.vc.taskDueDateInvalid": "د نیټې پای ناسم دی.",
    "apiErrors.validation.vc.taskNumericFieldInvalid":
      "ساعتونه او نمرې باید سم بشپړ عددونه وي.",
    "apiErrors.validation.vc.taskRequirementsInvalid":
      "د غوښتنو لړۍ ناسمه یا ډېره اوږده ده.",
    "apiErrors.validation.vc.submissionDescriptionMaxLen":
      "د وسپارنې تشریح ډېره اوږده ده.",
    "apiErrors.validation.vc.submissionBranchInvalid": "د څانګې نوم ناسم دی.",
    "apiErrors.validation.vc.submissionCommitInvalid":
      "د commit هش باید ۷–۱۲۸ ستنې hex وي.",
    "apiErrors.validation.vc.submissionUrlInvalid":
      "د PR لینک باید سم http(s) وي.",
    "apiErrors.validation.vc.submissionPullRequestIdInvalid":
      "د PR پېژند باید مثبت بشپړ عدد وي.",
    "apiErrors.validation.vc.submissionFilesInvalid":
      "د فایلونو لیست ناسم یا ډېر اوږد دی.",
    "apiErrors.validation.vc.submissionNeedsArtifact":
      "د PR پېژند، PR لینک، تشریح، څانګه، commit یا د فایل لارې زیات کړئ.",
    "apiErrors.validation.vc.reviewFeedbackMaxLen": "د ارزونې تبصره ډېره اوږده ده.",
    "apiErrors.validation.vc.reviewScoreInvalid":
      "د ارزونې نمره باید د اجازې حد کې بشپړ عدد وي.",
    "apiErrors.validation.vc.reviewChecklistInvalid":
      "د غوښتنو چک‌لیست ناسم دی.",
    "apiErrors.validation.vc.reviewPullRequestIdInvalid":
      "د PR پېژند باید مثبت بشپړ عدد وي.",
    "apiErrors.validation.vc.assignUsernameInvalid": "د کارن نوم بڼه ناسمه ده.",
    "apiErrors.failed_to_load_session": "نشو کړای چې ستاسو ناسته ولېږدوي.",
    "apiErrors.failed_to_load_stats": "احصایې نشي پورته کیدی.",
    "apiErrors.failed_to_load_file": "فایل نشو پورته کیدی.",
    "apiErrors.failed_to_search_repositories":
      "نشو کړای چې مخزونونه ومومي. بل کلمه ولیکئ.",
    "apiErrors.failed_to_mark_notification_read":
      "د خبرتیا د لوستل شوي په توګه نښه کولو کې ستونزه.",
    "apiSuccess.completed": "په بریالیتوب سره بشپړ شو.",
  },
  prs: {
    "apiErrors.generic": "مشکلی رخ داد. دوباره تلاش کنید.",
    "apiErrors.requestFailed": "درخواست ناموفق بود.",
    "apiErrors.network": "ارتباط اینترنت را بررسی و دوباره تلاش کنید.",
    "apiErrors.timeout": "درخواست طولانی شد. دوباره تلاش کنید.",
    "apiErrors.http.400": "درخواست نامعتبر است.",
    "apiErrors.http.401": "دوباره وارد شوید یا نشست منقضی شده است.",
    "apiErrors.http.403": "مجوز این کار را ندارید.",
    "apiErrors.http.404": "مورد یافت نشد.",
    "apiErrors.http.409": "داده‌ها تغییر کردند. بارگذاری مجدد و تلاش دوباره.",
    "apiErrors.http.422": "برخی فیلدها باید اصلاح شوند.",
    "apiErrors.http.429": "تلاش‌های زیاد. کمی صبر کنید.",
    "apiErrors.http.500": "خطای سرور. بعداً دوباره تلاش کنید.",
    "apiErrors.http.502": "سرویس موقتاً در دسترس نیست.",
    "apiErrors.http.503": "سرویس در دسترس نیست. بعداً تلاش کنید.",
    "apiErrors.validation.emailUsernamePasswordRequired":
      "ایمیل/نام کاربری و رمز عبور لازم است.",
    "apiErrors.validation.fullNameEmailPasswordRequired":
      "نام کامل، ایمیل و رمز عبور لازم است.",
    "apiErrors.validation.refreshTokenRequired": "توکن تازه‌سازی لازم است.",
    "apiErrors.validation.emailRequired": "ایمیل لازم است.",
    "apiErrors.validation.invalidResetTokenOrPasswordMismatch":
      "لینک بازنشانی نامعتبر است یا رمزها مطابقت ندارند.",
    "apiErrors.validation.verificationTokenRequired":
      "توکن تأیید لازم است.",
    "apiErrors.validation.invalidPasswords": "رمزها معتبر نیستند.",
    "apiErrors.validation.vc.milestoneTitleRequired": "عنوان نقاط عطف الزامی است.",
    "apiErrors.validation.vc.milestoneTitleMaxLen": "عنوان نقاط عطف طولانی است.",
    "apiErrors.validation.vc.milestoneDescriptionMaxLen":
      "توضیحات نقطهٔ عطف خیلی طولانی است.",
    "apiErrors.validation.vc.milestoneRubricMaxLen": "متن روبریک خیلی طولانی است.",
    "apiErrors.validation.vc.milestoneDueDateInvalid": "تاریخ سررسید معتبر نیست.",
    "apiErrors.validation.vc.milestoneScoresInvalid":
      "نمره‌ها باید اعداد صحیح مجاز باشند.",
    "apiErrors.validation.vc.milestonePassingExceedsMax":
      "نمرهٔ قبولی نمی‌تواند از حداکثر بیشتر باشد.",
    "apiErrors.validation.vc.milestoneRequiredTasksInvalid":
      "تعداد وظایف موردنیاز نامعتبر است.",
    "apiErrors.validation.vc.taskTitleRequired": "عنوان وظیفه الزامی است.",
    "apiErrors.validation.vc.taskTitleMaxLen": "عنوان وظیفه طولانی است.",
    "apiErrors.validation.vc.taskDescriptionMaxLen": "توضیحات وظیفه طولانی است.",
    "apiErrors.validation.vc.taskMilestoneNumberInvalid":
      "شمارهٔ نقطهٔ عطف باید عدد صحیح مثبت باشد.",
    "apiErrors.validation.vc.taskPriorityInvalid":
      "اولویت معتبر انتخاب کنید (کم، متوسط، بالا، بحرانی).",
    "apiErrors.validation.vc.taskLabelsInvalid":
      "برچسب‌ها باید از فهرست پشتیبان‌شده باشند.",
    "apiErrors.validation.vc.taskDueDateInvalid": "تاریخ سررسید معتبر نیست.",
    "apiErrors.validation.vc.taskNumericFieldInvalid":
      "ساعت‌ها و نمره‌ها باید اعداد صحیح معتبر باشند.",
    "apiErrors.validation.vc.taskRequirementsInvalid":
      "فهرست الزامات نامعتبر یا بسیار طولانی است.",
    "apiErrors.validation.vc.submissionDescriptionMaxLen":
      "توضیح ارسال طولانی است.",
    "apiErrors.validation.vc.submissionBranchInvalid": "نام شاخه نامعتبر است.",
    "apiErrors.validation.vc.submissionCommitInvalid":
      "هش کامیت باید ۷–۱۲۸ کاراکتر hexadecimal باشد.",
    "apiErrors.validation.vc.submissionUrlInvalid":
      "آدرس درخواست ادغام باید پیوند http(s) معتبر باشد.",
    "apiErrors.validation.vc.submissionPullRequestIdInvalid":
      "شناسهٔ درخواست ادغام باید عدد صحیح مثبت باشد.",
    "apiErrors.validation.vc.submissionFilesInvalid":
      "فهرست پرونده‌ها نامعتبر یا بسیار بلند است.",
    "apiErrors.validation.vc.submissionNeedsArtifact":
      "شناسهٔ PR، پیوند PR، توضیح، شاخه، کامیت یا مسیر پرونده‌ها را وارد کنید.",
    "apiErrors.validation.vc.reviewFeedbackMaxLen": "بازخورد ارزیابی طولانی است.",
    "apiErrors.validation.vc.reviewScoreInvalid":
      "نمرهٔ ارزیابی باید عدد صحیح مجاز باشد.",
    "apiErrors.validation.vc.reviewChecklistInvalid": "چک‌لیست الزامات نامعتبر است.",
    "apiErrors.validation.vc.reviewPullRequestIdInvalid":
      "شناسهٔ درخواست ادغام باید عدد صحیح مثبت باشد.",
    "apiErrors.validation.vc.assignUsernameInvalid": "قالب نام کاربری نامعتبر است.",
    "apiErrors.failed_to_load_session": "بارگذاری نشست ممکن نشد.",
    "apiErrors.failed_to_load_stats": "بارگذاری آمار ممکن نشد.",
    "apiErrors.failed_to_load_file": "بارگذاری پرونده ممکن نشد.",
    "apiErrors.failed_to_search_repositories":
      "جستجوی مخزن‌ها ناموفق بود. کلمهٔ دیگر امتحان کنید.",
    "apiErrors.failed_to_mark_notification_read":
      "اعلان به‌عنوان خوانده‌شده علامت‌گذاری نشد.",
    "apiSuccess.completed": "با موفقیت انجام شد.",
  },
};
