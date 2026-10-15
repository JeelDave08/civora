const nodemailer = require('nodemailer');

// Configure transport using environment variables or test Ethereal account
const createTransporter = async () => {
  const host = (process.env.EMAIL_HOST || '').trim();
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (host && user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      host: host,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false, // 587 uses STARTTLS
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  // Fallback to ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendWelcomeCredentialsEmail = async ({ toEmail, name, loginEmail, password, role, department }) => {
  try {
    const transporter = await createTransporter();
    const senderEmail = (process.env.EMAIL_USER || 'admin@civora.gov').trim();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #4CC9B0; margin: 0; font-size: 24px;">Civora Smart City Portal</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Official Personnel Credentials</p>
        </div>

        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #1e293b;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Your account as a <strong>${role.toUpperCase()}</strong> (${department || 'General Department'}) has been successfully created by the City Administrator.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #0f172a;">YOUR LOGIN CREDENTIALS:</p>
            <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Login Civora Email:</strong> <span style="color: #2563eb;">${loginEmail}</span></p>
            <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Please log in at <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #4CC9B0; text-decoration: none; font-weight: bold;">Civora Portal</a> using the login email listed above.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8; border-radius: 0 0 12px 12px;">
          Civora Smart City Management System • Confidential Email
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Civora City Admin" <${senderEmail}>`,
      to: toEmail,
      subject: `[Civora] Welcome ${name} - Your ${role.toUpperCase()} Credentials`,
      html: htmlContent,
    });

    console.log(`[SMTP SUCCESS] Email dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[SMTP ERROR] Failed to send credentials email:', err);
    return false;
  }
};

/**
 * Sends an official CIVORA work assignment notification email to a field worker.
 * No login required to review assignment details.
 */
const sendWorkAssignmentEmail = async (workerOrObj, complaintArg, supervisorArg, isUpdateArg = false) => {
  let worker, complaint, supervisor, isUpdate;
  if (workerOrObj && (workerOrObj.worker || workerOrObj.complaint)) {
    worker = workerOrObj.worker;
    complaint = workerOrObj.complaint;
    supervisor = workerOrObj.supervisor;
    isUpdate = Boolean(workerOrObj.isUpdate || isUpdateArg);
  } else {
    worker = workerOrObj;
    complaint = complaintArg;
    supervisor = supervisorArg;
    isUpdate = Boolean(isUpdateArg);
  }

  try {
    // 1. Resolve worker email from existing database fields
    const recipientEmail = (worker?.personalEmail && worker.personalEmail.trim() && worker.personalEmail.includes('@'))
      ? worker.personalEmail.trim()
      : (worker?.email && worker.email.trim() && worker.email.includes('@') ? worker.email.trim() : '');

    if (!recipientEmail) {
      const errMsg = 'Worker does not have a valid email address';
      console.error(`Work assignment email failed for worker ${worker?._id || 'unknown'}, complaint ${complaint?._id || 'unknown'}: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    // 2. Data mapping
    const ticketCode = complaint?.code || complaint?.ticketId || (complaint?._id ? `CMP-${String(complaint._id).slice(-4).toUpperCase()}` : 'CMP-TASK');
    const cleanCompId = String(ticketCode).replace(/^#/, '');

    const workerName = worker?.fullName || worker?.name || 'Field Specialist';
    const title = complaint?.title || 'Civic Infrastructure Work';
    const category = complaint?.category || 'General';
    const priority = complaint?.priority || 'Medium';
    const department = complaint?.department || worker?.department || 'Municipal Services';
    const description = complaint?.description || 'No detailed work description provided.';

    // Priority badge colors
    let priorityBg = '#fef3c7';
    let priorityColor = '#92400e';
    if (priority === 'Critical') {
      priorityBg = '#fee2e2';
      priorityColor = '#b91c1c';
    } else if (priority === 'High') {
      priorityBg = '#ffedd5';
      priorityColor = '#c2410c';
    } else if (priority === 'Low') {
      priorityBg = '#d1fae5';
      priorityColor = '#065f46';
    }

    // Schedule dates
    const formatDate = (dateVal) => {
      if (!dateVal) return 'Not specified';
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (e) {
        return String(dateVal);
      }
    };
    const startDateStr = formatDate(complaint?.startDate);
    const dueDateStr = formatDate(complaint?.dueDate);

    // Location & map
    const lat = complaint?.location?.lat;
    const lng = complaint?.location?.lng;
    const hasCoords = (lat !== undefined && lat !== null && !isNaN(Number(lat))) &&
                      (lng !== undefined && lng !== null && !isNaN(Number(lng)));
    const address = complaint?.location?.address || (hasCoords ? `Coordinates: ${lat}, ${lng}` : 'Assigned field location');

    let mapUrl = 'https://www.google.com/maps';
    if (hasCoords) {
      mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    } else if (complaint?.location?.address) {
      mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(complaint.location.address)}`;
    }

    // Supervisor details
    const supervisorName = supervisor?.fullName || supervisor?.name || 'Civora Supervisor';
    const supervisorEmail = supervisor?.email || supervisor?.personalEmail || '';
    const assignedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // 3. Build HTML Email
    const emailSubject = isUpdate 
      ? `Work Assignment Updated – CIVORA #${cleanCompId}` 
      : `New Work Assignment – CIVORA #${cleanCompId}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px 24px; text-align: center;">
              <h1 style="color: #4CC9B0; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">CIVORA</h1>
              <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Smart City Operations</p>
              <div style="display: inline-block; margin-top: 14px; background: rgba(76, 201, 176, 0.15); border: 1px solid #4CC9B0; color: #4CC9B0; font-size: 12px; font-weight: 700; padding: 5px 16px; border-radius: 20px; letter-spacing: 0.5px;">
                ${isUpdate ? 'WORK ASSIGNMENT UPDATED' : 'NEW WORK ASSIGNMENT'}
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px 24px 10px 24px;">
              <p style="font-size: 16px; color: #1e293b; margin: 0 0 8px 0;">Hello <strong>${workerName}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                ${isUpdate 
                  ? 'This work assignment has been updated by your supervisor. Please use the latest details below.' 
                  : 'A new civic work order has been assigned to you. Please review the assignment details, schedule, and location below.'}
              </p>

              <!-- WORK DETAILS SECTION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">WORK DETAILS</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Complaint ID:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
                          <code style="background-color: #e2e8f0; color: #0f172a; padding: 3px 8px; border-radius: 6px; font-size: 13px; font-weight: bold;">#${cleanCompId}</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Title:</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Category:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #334155; font-weight: 600;">${category}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Priority:</td>
                        <td style="padding: 6px 0;">
                          <span style="display: inline-block; background-color: ${priorityBg}; color: ${priorityColor}; font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 6px; text-transform: uppercase;">
                            ${priority}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Department:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #334155; font-weight: 600;">${department}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- WORK DESCRIPTION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">DESCRIPTION</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; font-size: 14px; color: #334155; line-height: 1.6;">
                    ${description}
                  </td>
                </tr>
              </table>

              <!-- SCHEDULE -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">SCHEDULE</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Scheduled Start Date:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${startDateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Estimated Due Date:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${dueDateStr}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- LOCATION & MAP -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">LOCATION</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                      ${address}
                    </p>
                    ${hasCoords ? `
                    <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b;">
                      <strong>Coordinates:</strong> Latitude: ${lat} | Longitude: ${lng}
                    </p>
                    ` : ''}
                    <div style="text-align: center; margin: 16px 0 6px 0;">
                      <a href="${mapUrl}" target="_blank" style="background-color: #0f172a; color: #4CC9B0; border: 1.5px solid #4CC9B0; padding: 12px 26px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; display: inline-block; letter-spacing: 0.5px;">
                        📍 VIEW LOCATION ON MAP
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ASSIGNMENT INFORMATION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">ASSIGNED BY</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Supervisor:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${supervisorName}${supervisorEmail ? ` (${supervisorEmail})` : ''}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">${isUpdate ? 'Updated Date:' : 'Assignment Date:'}</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #334155;">${assignedAt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Operational Guidance Notice -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 16px; margin: 10px 0 20px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">
                  Please review the work details and visit the assigned location.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 24px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #475569;">CIVORA Smart City Platform</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Municipal Operations & Field Workforce Management System</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 4. Send email via Nodemailer
    const transporter = await createTransporter();
    const senderEmail = (process.env.EMAIL_USER || 'admin@civora.gov').trim();

    const info = await transporter.sendMail({
      from: `"CIVORA Field Operations" <${senderEmail}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: htmlContent,
    });

    console.log(`[ASSIGNMENT EMAIL SUCCESS] ${isUpdate ? 'Updated' : 'New'} work assignment email dispatched to ${recipientEmail} for complaint #${cleanCompId}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Work assignment email failed for worker ${worker?._id || 'unknown'}, complaint ${complaint?._id || 'unknown'}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Sends a live civic report alert to the designated Ward Supervisor.
 */
const sendWardSupervisorLiveReportEmail = async ({ supervisor, complaint, citizenName, livePhotoUrl, capturedAt, wardNumber }) => {
  try {
    const recipientEmail = (supervisor?.personalEmail && supervisor.personalEmail.trim() && supervisor.personalEmail.includes('@'))
      ? supervisor.personalEmail.trim()
      : (supervisor?.email && supervisor.email.trim() && supervisor.email.includes('@') ? supervisor.email.trim() : '');

    if (!recipientEmail) {
      const errMsg = 'Ward Supervisor does not have a valid email address';
      console.error(`Live report email failed for supervisor ${supervisor?._id || 'unknown'}, complaint ${complaint?._id || 'unknown'}: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const ticketCode = complaint?.code || complaint?.ticketId || (complaint?._id ? `CMP-${String(complaint._id).slice(-4).toUpperCase()}` : 'CMP-LIVE');
    const cleanCompId = String(ticketCode).replace(/^#/, '');

    const resolvedWard = wardNumber || complaint?.ward || supervisor?.wardNumber || 'General';
    const title = complaint?.title || 'Live Civic Issue Reported';
    const category = complaint?.category || 'General';
    const priority = complaint?.priority || 'Medium';
    const description = complaint?.description || 'No description provided.';
    const reporterName = citizenName || 'Verified Citizen';
    const supervisorName = supervisor?.fullName || 'Ward Supervisor';

    // Priority badge colors
    let priorityBg = '#fef3c7';
    let priorityColor = '#92400e';
    if (priority === 'Critical') {
      priorityBg = '#fee2e2';
      priorityColor = '#b91c1c';
    } else if (priority === 'High') {
      priorityBg = '#ffedd5';
      priorityColor = '#c2410c';
    } else if (priority === 'Low') {
      priorityBg = '#d1fae5';
      priorityColor = '#065f46';
    }

    // Location coordinates & map URL
    const lat = complaint?.location?.lat;
    const lng = complaint?.location?.lng;
    const hasCoords = (lat !== undefined && lat !== null && !isNaN(Number(lat))) &&
                      (lng !== undefined && lng !== null && !isNaN(Number(lng)));
    const address = complaint?.location?.address || (hasCoords ? `Coordinates: ${lat}, ${lng}` : 'Field GPS Location');

    let mapUrl = 'https://www.google.com/maps';
    if (hasCoords) {
      mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    } else if (complaint?.location?.address) {
      mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(complaint.location.address)}`;
    }

    // Capture timestamp
    const captureTime = capturedAt ? new Date(capturedAt) : new Date();
    const formattedTimestamp = isNaN(captureTime.getTime()) 
      ? String(capturedAt) 
      : captureTime.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

    const photoUrl = livePhotoUrl || complaint?.imageUrl || (Array.isArray(complaint?.images) && complaint?.images[0]) || '';

    const emailSubject = `🚨 New Live Civic Report – Ward ${resolvedWard}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
              <h1 style="color: #4CC9B0; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">CIVORA</h1>
              <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Live Civic Intelligence Alert</p>
              <div style="display: inline-block; margin-top: 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px;">
                🚨 LIVE CIVIC REPORT – WARD ${resolvedWard}
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 26px 24px 10px 24px;">
              <p style="font-size: 15px; color: #1e293b; margin: 0 0 6px 0;">Hello <strong>${supervisorName}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 20px 0;">
                A new live civic issue has been captured via camera with real-time GPS coordinates in <strong>Ward ${resolvedWard}</strong>. Please review the report details below.
              </p>

              <!-- COMPLAINT DETAILS SECTION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">COMPLAINT DETAILS</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="padding: 5px 0; font-size: 13px; color: #64748b; font-weight: 600;">Complaint ID:</td>
                        <td style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
                          <code style="background-color: #e2e8f0; color: #0f172a; padding: 2px 7px; border-radius: 6px; font-size: 13px; font-weight: bold;">#${cleanCompId}</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; font-weight: 600;">Title:</td>
                        <td style="padding: 5px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; font-weight: 600;">Category:</td>
                        <td style="padding: 5px 0; font-size: 13px; color: #334155; font-weight: 600;">${category}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; font-weight: 600;">Priority:</td>
                        <td style="padding: 5px 0;">
                          <span style="display: inline-block; background-color: ${priorityBg}; color: ${priorityColor}; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                            ${priority}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- DESCRIPTION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">DESCRIPTION</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; font-size: 14px; color: #334155; line-height: 1.5;">
                    ${description}
                  </td>
                </tr>
              </table>

              <!-- LOCATION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">LOCATION</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="35%" style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Address:</td>
                        <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${address}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Latitude:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #0f172a; font-family: monospace;">${lat !== undefined && lat !== null ? lat : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Longitude:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #0f172a; font-family: monospace;">${lng !== undefined && lng !== null ? lng : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Ward:</td>
                        <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${resolvedWard}</td>
                      </tr>
                    </table>

                    <div style="text-align: center; margin-top: 14px;">
                      <a href="${mapUrl}" target="_blank" style="background-color: #0f172a; color: #4CC9B0; border: 1.5px solid #4CC9B0; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; text-decoration: none; display: inline-block;">
                        📍 VIEW LOCATION ON MAP
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- LIVE PHOTO EVIDENCE -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">LIVE PHOTO</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    ${photoUrl ? `
                      <div style="margin-bottom: 12px;">
                        <img src="${photoUrl}" alt="Live Photo Evidence" style="max-width: 100%; max-height: 280px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: cover;" />
                      </div>
                      <a href="${photoUrl}" target="_blank" style="color: #2563eb; font-size: 12px; font-weight: 600; text-decoration: underline;">
                        📷 View / Open High-Res Photo
                      </a>
                    ` : `
                      <p style="font-size: 13px; color: #64748b; margin: 0;">Live photo captured with GPS verification.</p>
                    `}
                  </td>
                </tr>
              </table>

              <!-- CAPTURE & REPORT INFORMATION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.8px;">CAPTURE & CITIZEN INFO</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Captured At:</td>
                        <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${formattedTimestamp}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Reported By:</td>
                        <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${reporterName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 10px 0 16px 0;">
                Please review this civic report in CIVORA.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #475569;">CIVORA Smart City Platform</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Municipal Operations & Ward Field Management System</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const transporter = await createTransporter();
    const senderEmail = (process.env.EMAIL_USER || 'admin@civora.gov').trim();

    const info = await transporter.sendMail({
      from: `"CIVORA Live Field Alert" <${senderEmail}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: htmlContent,
    });

    console.log(`[WARD SUPERVISOR EMAIL SUCCESS] Dispatched to ${recipientEmail} for complaint #${cleanCompId} in Ward ${resolvedWard}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Live report email failed for supervisor ${supervisor?._id || 'unknown'}, complaint ${complaint?._id || 'unknown'}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendWelcomeCredentialsEmail, sendWorkAssignmentEmail, sendWardSupervisorLiveReportEmail };

