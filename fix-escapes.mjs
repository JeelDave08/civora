import fs from 'fs';
import path from 'path';
const dir = 'c:/Civora/src/pages';
const files = ['Feedback.tsx', 'Profile.tsx', 'Settings.tsx', 'NotFound.tsx', 'RaiseComplaint.tsx', 'Notifications.tsx', 'Rewards.tsx', 'TrackComplaint.tsx', 'MyComplaints.tsx', 'PublicStatistics.tsx', 'ComplaintDetails.tsx'];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\\\`/g, '\`').replace(/\\\$/g, '$');
    fs.writeFileSync(filePath, content);
  }
});
console.log('Fixed escape characters in pages.');
