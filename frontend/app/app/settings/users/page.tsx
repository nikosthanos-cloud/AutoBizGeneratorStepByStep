import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users | advisorai.gr Admin',
};

export default function SettingsUsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Χρήστες & Ρόλοι</h1>
      <p className="mt-2 text-muted-foreground">
        Διαχείριση εσωτερικών χρηστών και ρόλων. Σύντομα διαθέσιμο.
      </p>
    </div>
  );
}
