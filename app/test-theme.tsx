"use client";

import {
  Box,
  Typography,
  Button,
  Card,
  Sheet,
  Input,
  Textarea,
  Stack,
  Divider,
  Chip,
} from "@mui/joy";

export default function TestTheme() {
  return (
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      <Typography level="h1" sx={{ mb: 3 }}>
        MUI Joy Theme Test
      </Typography>
      
      <Stack spacing={4}>
        {/* Color Palette Test */}
        <Card>
          <Typography level="h2" sx={{ mb: 2 }}>Color Palette</Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button color="primary">Primary</Button>
              <Button color="success">Success</Button>
              <Button color="warning">Warning</Button>
              <Button color="danger">Danger</Button>
              <Button color="neutral">Neutral</Button>
            </Box>
            
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="outlined" color="primary">Primary Outlined</Button>
              <Button variant="outlined" color="success">Success Outlined</Button>
              <Button variant="outlined" color="warning">Warning Outlined</Button>
              <Button variant="outlined" color="danger">Danger Outlined</Button>
              <Button variant="outlined" color="neutral">Neutral Outlined</Button>
            </Box>
            
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="soft" color="primary">Primary Soft</Button>
              <Button variant="soft" color="success">Success Soft</Button>
              <Button variant="soft" color="warning">Warning Soft</Button>
              <Button variant="soft" color="danger">Danger Soft</Button>
              <Button variant="soft" color="neutral">Neutral Soft</Button>
            </Box>
          </Stack>
        </Card>
        
        {/* Typography Test */}
        <Card>
          <Typography level="h2" sx={{ mb: 2 }}>Typography</Typography>
          <Stack spacing={1}>
            <Typography level="h1">Heading 1</Typography>
            <Typography level="h2">Heading 2</Typography>
            <Typography level="h3">Heading 3</Typography>
            <Typography level="body-lg">Body Large</Typography>
            <Typography level="body-md">Body Medium</Typography>
            <Typography level="body-sm">Body Small</Typography>
            <Typography level="title-lg">Title Large</Typography>
            <Typography level="title-md">Title Medium</Typography>
            <Typography level="title-sm">Title Small</Typography>
          </Stack>
        </Card>
        
        {/* Form Components Test */}
        <Card>
          <Typography level="h2" sx={{ mb: 2 }}>Form Components</Typography>
          <Stack spacing={2}>
            <Input placeholder="Text Input" />
            <Input placeholder="Email Input" type="email" />
            <Textarea placeholder="Textarea" minRows={3} />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip>Default Chip</Chip>
              <Chip color="primary">Primary Chip</Chip>
              <Chip color="success">Success Chip</Chip>
              <Chip color="warning">Warning Chip</Chip>
              <Chip color="danger">Danger Chip</Chip>
            </Box>
          </Stack>
        </Card>
        
        {/* Layout Components Test */}
        <Card>
          <Typography level="h2" sx={{ mb: 2 }}>Layout Components</Typography>
          <Stack spacing={2}>
            <Sheet variant="outlined" sx={{ p: 2 }}>
              <Typography>Outlined Sheet</Typography>
            </Sheet>
            <Sheet variant="soft" sx={{ p: 2 }}>
              <Typography>Soft Sheet</Typography>
            </Sheet>
            <Sheet variant="solid" color="primary" sx={{ p: 2 }}>
              <Typography>Primary Solid Sheet</Typography>
            </Sheet>
          </Stack>
        </Card>
        
        {/* Divider Test */}
        <Card>
          <Typography level="h2" sx={{ mb: 2 }}>Dividers</Typography>
          <Stack spacing={2}>
            <Typography>Content above divider</Typography>
            <Divider />
            <Typography>Content below divider</Typography>
            <Divider orientation="vertical" sx={{ height: 40 }} />
            <Typography>Content after vertical divider</Typography>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
