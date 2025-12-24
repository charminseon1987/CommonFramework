import { ReactElement, createElement } from "react";

interface NavigationHeaderProps {
    onHomeClick: () => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
}

export function NavigationHeader({ onHomeClick, onExpandAll, onCollapseAll }: NavigationHeaderProps): ReactElement {
    return (
        <div className="nav-header">
            {/* 홈 버튼 */}
            <button
                className="nav-title nav-title-button"
                onClick={onHomeClick}
                title="홈으로 이동"
                aria-label="홈으로 이동"
                type="button"
            >
                홈
            </button>

            {/* 컨트롤 버튼 */}
            <div className="nav-controls">
                <button
                    className="nav-control-btn expand-all"
                    onClick={onExpandAll}
                    title="모두 펼치기"
                    aria-label="모두 펼치기"
                    type="button"
                >
                    <span className="sr-only">모두 펼치기</span>
                </button>

                <button
                    className="nav-control-btn collapse-all"
                    onClick={onCollapseAll}
                    title="모두 접기"
                    aria-label="모두 접기"
                    type="button"
                >
                    <span className="sr-only">모두 접기</span>
                </button>
            </div>
        </div>
    );
}
