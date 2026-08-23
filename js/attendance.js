$(function () {

  /*
   * Hike Associate Attendance
   * -------------------------
   * Demo data only.
   * Replace attendanceData with API response later.
   */

  const attendanceData = {

    "2026-08-03": {
      status: "Office Maintenance",
      type: "remote",
      mode: "WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Office maintenance day. Work from home."
    },

    "2026-08-04": {
      status: "Office Maintenance",
      type: "remote",
      mode: "WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Office maintenance day. Work from home."
    },

    "2026-08-05": {
      status: "Remote",
      type: "remote",
      mode: "Remote / WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Remote working day."
    },

    "2026-08-06": {
      status: "Present",
      type: "present",
      mode: "Office Day",
      checkIn: "10:26 AM",
      checkOut: "06:47 PM",
      hours: "8h 21m",
      punches: 2,
      progress: 93,
      note: "Regular working day."
    },

    "2026-08-07": {
      status: "Remote",
      type: "remote",
      mode: "Remote / WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Remote working day."
    },

    "2026-08-10": {
      status: "Present",
      type: "present",
      mode: "Office Day",
      checkIn: "10:24 AM",
      checkOut: "06:46 PM",
      hours: "8h 22m",
      punches: 2,
      progress: 93,
      note: "Regular working day."
    },

    "2026-08-11": {
      status: "Present",
      type: "present",
      mode: "Office Day",
      checkIn: "10:29 AM",
      checkOut: "06:47 PM",
      hours: "8h 18m",
      punches: 2,
      progress: 92,
      note: "Regular working day."
    },

    "2026-08-12": {
      status: "Remote",
      type: "remote",
      mode: "Remote / WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Remote working day."
    },

    "2026-08-13": {
      status: "Present",
      type: "present",
      mode: "Office Day",
      checkIn: "10:25 AM",
      checkOut: "06:01 PM",
      hours: "7h 36m",
      punches: 2,
      progress: 84,
      note: "Short working day."
    },

    "2026-08-14": {
      status: "Remote",
      type: "remote",
      mode: "Remote / WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Remote working day."
    },

    "2026-08-15": {
      status: "Holiday",
      type: "holiday",
      mode: "Holiday",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Independence Day."
    },

    "2026-08-17": {
      status: "Late Login",
      type: "late",
      mode: "Office Day",
      checkIn: "11:08 AM",
      checkOut: "07:01 PM",
      hours: "7h 53m",
      punches: 2,
      progress: 88,
      note: "Late login recorded."
    },

    "2026-08-18": {
      status: "Present",
      type: "present",
      mode: "Office Day",
      checkIn: "10:24 AM",
      checkOut: "06:46 PM",
      hours: "8h 22m",
      punches: 2,
      progress: 93,
      note: "Regular working day."
    },

    "2026-08-19": {
      status: "Remote",
      type: "remote",
      mode: "Remote / WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Remote working day."
    },

    "2026-08-20": {
      status: "Present",
      type: "present",
      mode: "Office Day",
      checkIn: "10:22 AM",
      checkOut: "06:50 PM",
      hours: "8h 28m",
      punches: 2,
      progress: 94,
      note: "Regular working day."
    },

    "2026-08-21": {
      status: "Remote",
      type: "remote",
      mode: "Remote / WFH",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "Remote working day."
    }

  };


  /* =========================================================
     HELPERS
  ========================================================= */

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function parseMinutes(hoursText) {
    if (!hoursText || hoursText === "—") {
      return 0;
    }

    const hours = Number((hoursText.match(/(\d+)h/) || [0, 0])[1]);
    const minutes = Number((hoursText.match(/(\d+)m/) || [0, 0])[1]);

    return (hours * 60) + minutes;
  }


  function minutesToHours(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  }


  function getDefaultAttendance() {
    return {
      status: "No attendance record",
      type: "neutral",
      mode: "—",
      checkIn: "--",
      checkOut: "--",
      hours: "—",
      punches: 0,
      progress: 0,
      note: "No attendance information is available for this date."
    };
  }


  function getStatusIcon(type) {

    const icons = {
      present: "bi-check-circle-fill",
      late: "bi-clock-fill",
      absent: "bi-x-circle-fill",
      remote: "bi-house-fill",
      holiday: "bi-calendar-event-fill",
      neutral: "bi-info-circle-fill"
    };

    return icons[type] || icons.neutral;
  }


  function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }


  function updateMonthSummary() {

    const currentDate = calendar.getDate();
    const monthKey = getMonthKey(currentDate);

    const items = Object.entries(attendanceData)
      .filter(([date]) => date.startsWith(monthKey))
      .map(([, item]) => item);

    const present = items.filter(item => item.type === "present").length;
    const late = items.filter(item => item.type === "late").length;
    const remote = items.filter(item => item.type === "remote").length;
    const holiday = items.filter(item => item.type === "holiday").length;

    const totalMinutes = items
      .filter(item => item.type === "present" || item.type === "late")
      .reduce((total, item) => total + parseMinutes(item.hours), 0);

    const workingDays = items.filter(
      item => item.type === "present" || item.type === "late"
    ).length;

    const average = workingDays
      ? minutesToHours(totalMinutes / workingDays)
      : "—";

    $("#presentCount").text(present);
    $("#lateCount").text(late);
    $("#remoteCount").text(remote);
    $("#holidayCount").text(holiday);
    $("#averageHours").text(average);

    $("#calendarMonthLabel").text(
      currentDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
      })
    );

    const monthStatus =
      late <= 1
        ? "On track"
        : "Needs attention";

    $("#monthStatusText").text(monthStatus);

    $(".month-status")
      .toggleClass("attention", late > 1);
  }


  /* =========================================================
     DRAWER
  ========================================================= */

  function openDrawer(dateStr) {

    const data = attendanceData[dateStr] || getDefaultAttendance();

    const date = new Date(`${dateStr}T12:00:00`);

    const day = date.toLocaleDateString("en-IN", {
      weekday: "long"
    });

    const fullDate = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });


    $("#drawerDay").text(day);
    $("#drawerDate").text(fullDate);


    $("#drawerStatus")
      .removeClass("present late absent remote holiday neutral")
      .addClass(data.type)
      .html(
        `<i class="bi ${getStatusIcon(data.type)}"></i> ${data.status}`
      );


    $("#drawerMode").text(data.mode);
    $("#drawerCheckIn").text(data.checkIn);
    $("#drawerCheckOut").text(data.checkOut);
    $("#drawerHours").text(data.hours);
    $("#drawerPunches").text(data.punches);


    $("#drawerProgress").text(
      data.progress
        ? `${data.progress}% of 9h`
        : "No tracked hours"
    );


    $("#drawerProgressBar").css(
      "width",
      `${data.progress || 0}%`
    );


    $("#drawerNote").html(
      `<i class="bi bi-info-circle"></i><span>${data.note}</span>`
    );


    $("#attendanceBackdrop").addClass("open");
    $("#attendanceDrawer").addClass("open");

    $("body").css("overflow", "hidden");
  }


  function closeDrawer() {

    $("#attendanceBackdrop").removeClass("open");
    $("#attendanceDrawer").removeClass("open");

    $("body").css("overflow", "");
  }


  /* =========================================================
     CALENDAR EVENT CONTENT
  ========================================================= */

  function buildDayContent(item) {

    const icon = getStatusIcon(item.type);

    const timeHtml =
      item.checkIn && item.checkIn !== "--"
        ? `<div class="event-time">${item.checkIn} · ${item.checkOut}</div>`
        : "";

    const progressHtml =
      item.progress
        ? `<div class="day-progress-line">
             <span style="width:${item.progress}%"></span>
           </div>`
        : "";

    return `
      <div class="attendance-event ${item.type}">
        <div class="event-title">
          <i class="bi ${icon}"></i>
          <span>${item.status}</span>
        </div>

        ${timeHtml}
        ${progressHtml}
      </div>
    `;
  }


  function buildEvents() {

    return Object.entries(attendanceData).map(([date, item]) => ({
      id: date,
      title: item.status,
      start: date,
      allDay: true,
      classNames: ["attendance-fc-event", item.type],
      extendedProps: {
        attendance: item
      }
    }));
  }


  /* =========================================================
     CALENDAR
  ========================================================= */

  const calendarElement =
    document.getElementById("attendanceCalendar");


  if (!calendarElement) {
    console.error("Attendance calendar element not found.");
    return;
  }


  if (typeof FullCalendar === "undefined") {
    console.error(
      "FullCalendar is not loaded. Check the FullCalendar CDN in attendance.html."
    );
    return;
  }


  const calendar = new FullCalendar.Calendar(
    calendarElement,
    {

      initialView: "dayGridMonth",

      initialDate: "2026-08-18",

      height: "auto",

      fixedWeekCount: false,

      showNonCurrentDates: true,

      headerToolbar: false,

      dayMaxEvents: false,

      events: buildEvents(),


      datesSet(info) {
        updateMonthSummary();

        const currentMonth = new Date(info.view.currentStart);

        $("#calendarMonthLabel").text(
          currentMonth.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
          })
        );
      },


      eventContent(info) {

        const item = info.event.extendedProps.attendance;

        if (!item) {
          return { html: "" };
        }

        return {
          html: buildDayContent(item)
        };
      },


      eventClick(info) {

        info.jsEvent.preventDefault();

        openDrawer(
          info.event.startStr
        );
      },


      dateClick(info) {
        openDrawer(info.dateStr);
      },


      dayCellDidMount(info) {

        const day = info.date.getDay();

        if (day === 0 || day === 6) {
          info.el.classList.add("fc-day-weekend");
        }

      }

    }
  );


  calendar.render();


  /* =========================================================
     CUSTOM CALENDAR CONTROLS
  ========================================================= */

  $("#calendarPrev").on("click", function () {
    calendar.prev();
  });


  $("#calendarNext").on("click", function () {
    calendar.next();
  });


  $("#calendarMonthLabel").on("click", function () {
    calendar.today();
  });


  $("#todayBtn").on("click", function () {
    calendar.today();
  });


  /* =========================================================
     DRAWER EVENTS
  ========================================================= */

  $("#drawerClose").on("click", function () {
    closeDrawer();
  });


  $("#attendanceBackdrop").on("click", function () {
    closeDrawer();
  });


  $(document).on("keydown", function (event) {

    if (event.key === "Escape") {
      closeDrawer();
    }

  });

});