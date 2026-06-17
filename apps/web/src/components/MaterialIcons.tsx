/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

// Wrapper for Google Material Symbols
const MaterialIcon = ({ name, size = 24, className = '', ...props }: any) => {
  return (
    <span 
      className={`material-symbols-outlined ${className}`} 
      style={{ fontSize: size, ...props.style }}
      {...props}
    >
      {name}
    </span>
  );
};

// Social Icons SVGs (since Material Symbols doesn't have brand icons)
export const Facebook = ({ size = 24, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
export const Instagram = ({ size = 24, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
export const Youtube = ({ size = 24, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);
export const Tiktok = ({ size = 24, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 12a4 4 0 1 0 4 4V2a5 5 0 0 0 5 5"></path></svg>
);

// Mapped Icons
export const AlertTriangle = (p: any) => <MaterialIcon name="warning" {...p} />;
export const Archive = (p: any) => <MaterialIcon name="archive" {...p} />;
export const ArrowDownRight = (p: any) => <MaterialIcon name="south_east" {...p} />;
export const ArrowLeft = (p: any) => <MaterialIcon name="arrow_back" {...p} />;
export const ArrowRight = (p: any) => <MaterialIcon name="arrow_forward" {...p} />;
export const ArrowUpRight = (p: any) => <MaterialIcon name="north_east" {...p} />;
export const BarChart3 = (p: any) => <MaterialIcon name="bar_chart" {...p} />;
export const Bell = (p: any) => <MaterialIcon name="notifications" {...p} />;
export const Camera = (p: any) => <MaterialIcon name="photo_camera" {...p} />;
export const Check = (p: any) => <MaterialIcon name="check" {...p} />;
export const CheckCircle = (p: any) => <MaterialIcon name="check_circle" {...p} />;
export const CheckCircle2 = (p: any) => <MaterialIcon name="task_alt" {...p} />;
export const ChevronDown = (p: any) => <MaterialIcon name="expand_more" {...p} />;
export const ChevronLeft = (p: any) => <MaterialIcon name="chevron_left" {...p} />;
export const ChevronRight = (p: any) => <MaterialIcon name="chevron_right" {...p} />;
export const Clock = (p: any) => <MaterialIcon name="schedule" {...p} />;
export const DollarSign = (p: any) => <MaterialIcon name="attach_money" {...p} />;
export const Edit = (p: any) => <MaterialIcon name="edit" {...p} />;
export const Edit2 = (p: any) => <MaterialIcon name="edit_square" {...p} />;
export const Eye = (p: any) => <MaterialIcon name="visibility" {...p} />;
export const Filter = (p: any) => <MaterialIcon name="filter_alt" {...p} />;
export const Heart = (p: any) => <MaterialIcon name="favorite" {...p} />;
export const Home = (p: any) => <MaterialIcon name="home" {...p} />;
export const Image = (p: any) => <MaterialIcon name="image" {...p} />;
export const LayoutDashboard = (p: any) => <MaterialIcon name="dashboard" {...p} />;
export const Loader2 = ({ className = '', ...p }: any) => <MaterialIcon name="progress_activity" className={`animate-spin ${className}`} {...p} />;
export const Lock = (p: any) => <MaterialIcon name="lock" {...p} />;
export const LogOut = (p: any) => <MaterialIcon name="logout" {...p} />;
export const Mail = (p: any) => <MaterialIcon name="mail" {...p} />;
export const MapPin = (p: any) => <MaterialIcon name="location_on" {...p} />;
export const Menu = (p: any) => <MaterialIcon name="menu" {...p} />;
export const Minus = (p: any) => <MaterialIcon name="remove" {...p} />;
export const Moon = (p: any) => <MaterialIcon name="dark_mode" {...p} />;
export const MoreHorizontal = (p: any) => <MaterialIcon name="more_horiz" {...p} />;
export const Package = (p: any) => <MaterialIcon name="inventory_2" {...p} />;
export const Pencil = (p: any) => <MaterialIcon name="edit" {...p} />;
export const Phone = (p: any) => <MaterialIcon name="call" {...p} />;
export const Plus = (p: any) => <MaterialIcon name="add" {...p} />;
export const RefreshCw = (p: any) => <MaterialIcon name="autorenew" {...p} />;
export const Search = (p: any) => <MaterialIcon name="search" {...p} />;
export const Settings = (p: any) => <MaterialIcon name="settings" {...p} />;
export const Share2 = (p: any) => <MaterialIcon name="share" {...p} />;
export const Shield = (p: any) => <MaterialIcon name="shield" {...p} />;
export const ShieldAlert = (p: any) => <MaterialIcon name="gpp_maybe" {...p} />;
export const ShoppingBag = (p: any) => <MaterialIcon name="shopping_bag" {...p} />;
export const ShoppingCart = (p: any) => <MaterialIcon name="shopping_cart" {...p} />;
export const SlidersHorizontal = (p: any) => <MaterialIcon name="tune" {...p} />;
export const Sparkles = (p: any) => <MaterialIcon name="auto_awesome" {...p} />;
export const Star = (p: any) => <MaterialIcon name="star" {...p} />;
export const Sun = (p: any) => <MaterialIcon name="light_mode" {...p} />;
export const Tag = (p: any) => <MaterialIcon name="sell" {...p} />;
export const Trash2 = (p: any) => <MaterialIcon name="delete" {...p} />;
export const TrendingDown = (p: any) => <MaterialIcon name="trending_down" {...p} />;
export const TrendingUp = (p: any) => <MaterialIcon name="trending_up" {...p} />;
export const Truck = (p: any) => <MaterialIcon name="local_shipping" {...p} />;
export const User = (p: any) => <MaterialIcon name="person" {...p} />;
export const Users = (p: any) => <MaterialIcon name="group" {...p} />;
export const Warehouse = (p: any) => <MaterialIcon name="warehouse" {...p} />;
export const X = (p: any) => <MaterialIcon name="close" {...p} />;

// Additional icons
export const Award = (p: any) => <MaterialIcon name="workspace_premium" {...p} />;
export const ExternalLink = (p: any) => <MaterialIcon name="open_in_new" {...p} />;
export const MessageCircle = (p: any) => <MaterialIcon name="chat_bubble" {...p} />;
export const Play = (p: any) => <MaterialIcon name="play_arrow" {...p} />;
export const Send = (p: any) => <MaterialIcon name="send" {...p} />;
export const CreditCard = (p: any) => <MaterialIcon name="credit_card" {...p} />;
export const Scale = (p: any) => <MaterialIcon name="gavel" {...p} />;

