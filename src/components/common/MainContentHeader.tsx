import { Typography } from 'antd';

const { Text } = Typography;

interface MainContentHeaderProps {
    content: string;
}

export default function MainContentHeader({ content }: MainContentHeaderProps) {
    return (
        <div className="main-content-header">
            <Text type="secondary">{content}</Text>
        </div>
    );
}