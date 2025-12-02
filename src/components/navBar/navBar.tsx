import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "absolute", top: 32, left: 32 }}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ height: 3, width: 32, background: "#333", borderRadius: 2 }}></span>
              <span style={{ height: 3, width: 32, background: "#333", borderRadius: 2 }}></span>
              <span style={{ height: 3, width: 32, background: "#333", borderRadius: 2 }}></span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} style={{ minWidth: 220, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderRadius: 12, padding: 8 }}>
          <div style={{ fontWeight: 500, color: "#888", marginBottom: 8, marginLeft: 8 }}>Menu</div>
          <DropdownMenuItem asChild><NavLink to="/login">Login</NavLink></DropdownMenuItem>
          <DropdownMenuItem asChild><NavLink to="/create-account">Create Account</NavLink></DropdownMenuItem>
          <DropdownMenuItem asChild><NavLink to="/qr-code">QR Code</NavLink></DropdownMenuItem>
          <DropdownMenuItem asChild><NavLink to="/map">Map</NavLink></DropdownMenuItem>
          <DropdownMenuItem asChild>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ flex: 1 }}>Language</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" style={{ marginLeft: 8 }} onClick={(e) => { e.stopPropagation(); }}>
                    ▼
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={8} style={{ minWidth: 120, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderRadius: 8, padding: 4 }}>
                  <DropdownMenuItem>French</DropdownMenuItem>
                  <DropdownMenuItem>German</DropdownMenuItem>
                  <DropdownMenuItem>Englisch</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem asChild><NavLink to="/logout">Log out</NavLink></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default NavBar;
