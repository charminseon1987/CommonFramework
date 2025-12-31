import { useEffect, useState } from "react";

export function useMenuPositions(isEnabled: boolean) {
    const [menuPositions, setMenuPositions] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!isEnabled) return;

        const calculatePositions = () => {
            const positions: Record<string, number> = {};
            const menuItems = document.querySelectorAll(".horizontal-menu-depth-0 > .horizontal-menu-item");

            const containerRect = document.querySelector(".nav-topbar")?.getBoundingClientRect();

            if (!containerRect) return;

            menuItems.forEach(item => {
                const menuId = item.getAttribute("data-menu-id");
                if (!menuId) return;

                const rect = item.getBoundingClientRect();
                positions[menuId] = rect.left - containerRect.left;
            });

            setMenuPositions(positions);
        };

        requestAnimationFrame(calculatePositions);
        window.addEventListener("resize", calculatePositions);

        return () => window.removeEventListener("resize", calculatePositions);
    }, [isEnabled]);

    return menuPositions;
}
