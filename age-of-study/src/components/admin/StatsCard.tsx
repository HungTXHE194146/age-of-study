interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  textColor: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  bgColor,
  iconBgColor,
  textColor,
}: StatsCardProps) {
  return (
    <div
      className={`${bgColor} rounded-xl p-6 border-2 transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
