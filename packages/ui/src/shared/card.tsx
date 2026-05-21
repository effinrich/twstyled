import { styled } from 'tw-styled'

export const Card = styled.div`
  rounded-[--radius] border border-[--border] bg-[--card]
  text-[--card-foreground] shadow-sm
`
export const CardHeader = styled.div`flex flex-col space-y-1.5 p-6`
export const CardTitle = styled.h3`text-lg font-semibold leading-none tracking-tight`
export const CardDescription = styled.p`text-sm text-[--muted-foreground]`
export const CardContent = styled.div`p-6 pt-0`
export const CardFooter = styled.div`flex items-center p-6 pt-0`
