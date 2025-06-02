import { Gift, Award, Users, Disc } from "lucide-react"

interface ActivityItemProps {
  type: string
  title: string
  description: string
  timestamp?: string
  date?: string
}

export function ActivityItem({ type, title, description, timestamp, date }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case "mint":
        return <Disc className="text-theme-cyan" />
      case "reward":
        return <Gift className="text-theme-yellow" />
      case "referral":
        return <Users className="text-theme-pink" />
      default:
        return <Award className="text-white" />
    }
  }

  // Use timestamp or date, with timestamp taking precedence
  const displayDate = timestamp || (date ? new Date(date).toLocaleDateString() : "")

  return (
    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
      <div className="flex items-start gap-4">
        <div className="bg-white/10 rounded-full p-2">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <span className="text-white/60 text-sm">{displayDate}</span>
          </div>
          <p className="text-white/80 mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}
