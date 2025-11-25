import { NavLink, Routes } from "react-router-dom"

export default function navBar() {
    return (
        <nav>
            <NavLink to="/errorpage" className={({ isActive, isPending }) => isPending ? "pending" : isActive ? "active" : ""}>Errorpage</NavLink>
        </nav>
    );
}