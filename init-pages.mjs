import fs from 'fs';
import path from 'path';

const pages = [
  'ForgotPassword',
  'RaiseComplaint',
  'ComplaintCategories',
  'MyComplaints',
  'ComplaintDetails',
  'LiveTracking',
  'TrackComplaint',
  'PublicStatistics',
  'Notifications',
  'Rewards',
  'Feedback',
  'ContactUs',
  'AboutUs',
  'FAQ',
  'PrivacyPolicy',
  'Terms',
  'HelpCenter',
  'EmergencyContacts',
  'Profile',
  'Settings',
  'SearchResults',
  'NotFound'
];

pages.forEach(page => {
  const fileContent = `import React from 'react';
import { motion } from 'framer-motion';

export const ${page} = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold text-heading mb-6">${page.replace(/([A-Z])/g, ' $1').trim()}</h1>
      <div className="glass-card p-6">
        <p className="text-muted-foreground">This page is under construction.</p>
      </div>
    </motion.div>
  );
};
`;
  const targetPath = path.join('c:/Civora/src/pages', page + '.tsx');
  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, fileContent);
  }
});
console.log('Pages created successfully.');
